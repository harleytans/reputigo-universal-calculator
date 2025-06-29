/*
 * script.js for Reputigo Universal Service Cost Calculator
 * Hosted on GitHub Pages / Netlify
 *
 * This file contains all JavaScript logic for the calculator components,
 * including state management, pricing data, calculation functions, and event listeners
 * for all supported service industries.
 */

// --- GLOBAL STATE AND HELPER FUNCTIONS ---
const SQFT_PER_ACRE = 43560; // For Lawn Care conversions

let currentIndustry = 'cleaning'; // Default active industry
let universalDiscountPercent = 0;

// Universal DOM elements
const estimatedCostDisplay = document.getElementById('estimatedCost');
const universalDiscountInput = document.getElementById('universalDiscount');

// Generic helper to get element value
function getElementValue(id) {
    const element = document.getElementById(id);
    if (!element) return null; // Return null if element doesn't exist
    if (element.type === 'number' || element.type === 'text') {
        return parseFloat(element.value) || 0;
    }
    if (element.type === 'checkbox') {
        return element.checked;
    }
    return element.value;
}

// Generic counter adjustment (used by buttons with data-attributes)
function adjustCount(industry, type, delta) {
    const state = industries[industry].state;
    const elementId = industry + type.charAt(0).toUpperCase() + type.slice(1) + 'Value';
    const valueSpan = document.getElementById(elementId);

    if (state && valueSpan) {
        // Adjust value, ensuring non-negative where applicable (e.g., number of items/rooms)
        state[type] = Math.max(type === 'numDogs' || type === 'numUnits' || type === 'numFlues' || type === 'numRooms' || type === 'numFixtures' || type === 'numScreens' || type === 'numHardWaterWindows' || type === 'numSkylights' || type === 'numPatches' || type === 'numGates' || type === 'numRestrooms' || type === 'numStairs' || type === 'mattresses' || type === 'tires' || type === 'heavyItems' || type === 'numKeys' || type === 'duration' ? 0 : 0, state[type] + delta);
        // Ensure minimum 1 for counts that cannot be 0 (e.g., beds, baths, dogs)
        if (type === 'bedrooms' || type === 'bathrooms' || type === 'numDogs' || type === 'numUnits' || type === 'numFlues' || type === 'numRooms' || type === 'numFixtures' || type === 'numPatches' || type === 'numGates' || type === 'numRestrooms' || type === 'numStairs' || type === 'duration') {
             state[type] = Math.max(1, state[type]);
        }

        valueSpan.textContent = state[type];
        calculateOverallCost();
    }
}

// Generic addon visibility setup
function setupAddonVisibility(checkboxId, inputDivId, quantityInputId = null) {
    const checkbox = document.getElementById(checkboxId);
    const inputDiv = document.getElementById(inputDivId);
    const quantityInput = quantityInputId ? document.getElementById(quantityInputId) : null;

    if (checkbox && inputDiv) {
        checkbox.addEventListener('change', function() {
            inputDiv.classList.toggle('hidden', !this.checked);
            if (!this.checked && quantityInput) { quantityInput.value = 0; } // Reset quantity when unchecked
            calculateOverallCost();
        });
        if (quantityInput) { // Add input listener if quantity input exists
            quantityInput.addEventListener('input', calculateOverallCost);
        }
    }
}

// Helper to get cost for services that are area-based (sqft/acre)
function getCostForAreaService(areaInputEl, sqFtCosts, acreCosts, isAcresMode) {
    const area = parseFloat(areaInputEl.value) || 0;
    if (isAcresMode) { return { min: area * acreCosts.min, max: area * acreCosts.max }; }
    else { return { min: area * sqFtCosts.min, max: area * sqFtCosts.max }; }
}

// --- MASTER DATA STRUCTURE (ALL CALCULATORS' STATE, ELEMENTS, PRICING, AND CALC LOGIC) ---
const industries = {
    'cleaning': {
        state: { bedrooms: 1, bathrooms: 1, squareFootage: 1000, isSqFtMode: false },
        pricing: {
            base: { 'weekly': { min: 50, max: 65 }, 'monthly': { min: 70, max: 90 }, 'oneTime': { min: 100, max: 130 } },
            perRoom: { min: 15, max: 20 }, perBathroom: { min: 10, max: 15 },
            perSqFt: { min: 0.05, max: 0.15 },
            addOns: { floorCleaning: { min: 10, max: 15 }, appliances: { min: 20, max: 25 }, windowCleaning: { min: 15, max: 20 }, laundry: { min: 15, max: 20 } }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing;
            const visitType = getElementValue('cleaningVisitType');
            state.isSqFtMode = getElementValue('cleaningToggle');
            state.squareFootage = getElementValue('cleaningSquareFootage');
            state.bedrooms = getElementValue('cleaningBedroomsValue');
            state.bathrooms = getElementValue('cleaningBathroomsValue');

            const baseCosts = pricing.base[visitType];
            if (baseCosts) { costMin += baseCosts.min; costMax += baseCosts.max; }

            if (state.isSqFtMode) { costMin += Math.round(state.squareFootage * pricing.perSqFt.min); costMax += Math.round(state.squareFootage * pricing.perSqFt.max); }
            else { costMin += state.bedrooms * pricing.perRoom.min; costMax += state.bedrooms * pricing.perRoom.max; costMin += state.bathrooms * pricing.perBathroom.min; costMax += state.bathrooms * pricing.perBathroom.max; }
            
            if (getElementValue('cleaningFloorCleaning')) { costMin += pricing.addOns.floorCleaning.min; costMax += pricing.addOns.floorCleaning.max; }
            if (getElementValue('cleaningAppliances')) { costMin += pricing.addOns.appliances.min; costMax += pricing.addOns.appliances.max; }
            if (getElementValue('cleaningWindowCleaning')) { costMin += pricing.addOns.windowCleaning.min; costMax += pricing.addOns.windowCleaning.max; }
            if (getElementValue('cleaningLaundry')) { costMin += pricing.addOns.laundry.min; costMax += pricing.addOns.laundry.max; }
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            document.getElementById('cleaningVisitType').addEventListener('change', calculateOverallCost);
            document.getElementById('cleaningFloorCleaning').addEventListener('change', calculateOverallCost);
            document.getElementById('cleaningAppliances').addEventListener('change', calculateOverallCost);
            document.getElementById('cleaningWindowCleaning').addEventListener('change', calculateOverallCost);
            document.getElementById('cleaningLaundry').addEventListener('change', calculateOverallCost);
            document.getElementById('cleaningSquareFootage').addEventListener('input', calculateOverallCost);
            document.getElementById('cleaningToggle').addEventListener('change', this.initDisplay); // Calls initDisplay to handle toggle visuals
        },
        initDisplay: function() {
            this.state.isSqFtMode = document.getElementById('cleaningToggle').checked; // Update state on display init
            const roomsLabel = document.getElementById('cleaningRoomsLabel');
            const sqFtLabel = document.getElementById('cleaningSqFtLabel');
            const roomBasedInputs = document.getElementById('cleaningRoomBasedInputs');
            const bathroomInputs = document.getElementById('cleaningBathroomInputs');
            const squareFootageInput = document.getElementById('cleaningSquareFootageInput');

            if (this.state.isSqFtMode) {
                roomsLabel.classList.remove('rg-calc-active-toggle-text'); sqFtLabel.classList.add('rg-calc-active-toggle-text');
                roomBasedInputs.classList.add('hidden'); bathroomInputs.classList.add('hidden'); squareFootageInput.classList.remove('hidden');
            } else {
                roomsLabel.classList.add('rg-calc-active-toggle-text'); sqFtLabel.classList.remove('rg-calc-active-toggle-text');
                roomBasedInputs.classList.remove('hidden'); bathroomInputs.classList.remove('hidden'); squareFootageInput.classList.add('hidden');
            }
        }
    },
    'lawn-care': {
        state: { isAcresMode: false },
        pricing: {
            lawnMowingSqFt: { min: 0.01, max: 0.03 }, lawnMowingAcre: { min: 100, max: 200 },
            lawnAerationLiquidSqFt: { min: 0.005, max: 0.010 }, lawnAerationCoreSqFt: { min: 0.010, max: 0.020 },
            lawnAerationLiquidAcre: { min: 200, max: 400 }, lawnAerationCoreAcre: { min: 400, max: 800 },
            dethatchingSqFt: { min: 0.02, max: 0.04 }, dethatchingAcre: { min: 200, max: 400 },
            fertilizationSqFt: { min: 0.003, max: 0.007 }, fertilizationAcre: { min: 100, max: 200 },
            mulchCleanUpBags: { min: 10, max: 20 }, seedingSqFt: { min: 0.015, max: 0.03 }, seedingAcre: { min: 300, max: 600 },
            leafRemovalHours: { min: 40, max: 60 }, yardCleanupHours: { min: 35, max: 55 },
            weedControlSqFt: { min: 0.002, max: 0.006 }, weedControlAcre: { min: 80, max: 150 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const pricing = this.pricing;
            this.state.isAcresMode = getElementValue('lawnAreaToggle');
            const isAcresMode = this.state.isAcresMode;

            const getCostForLawnAreaService = (areaInputId, sqFtCosts, acreCosts) => {
                const area = getElementValue(areaInputId);
                return isAcresMode ? { min: area * acreCosts.min, max: area * acreCosts.max } : { min: area * sqFtCosts.min, max: area * sqFtCosts.max };
            };

            if (getElementValue('lawnMowing')) { const mowingCost = getCostForLawnAreaService('lawnMowingArea', pricing.lawnMowingSqFt, pricing.lawnMowingAcre); costMin += mowingCost.min; costMax += mowingCost.max; }
            if (getElementValue('lawnAeration')) {
                const aerationArea = getElementValue('lawnAerationArea'); const aerationType = getElementValue('lawnAerationType');
                let a_min, a_max;
                if (isAcresMode) { a_min = aerationArea * (aerationType === 'liquid' ? pricing.lawnAerationLiquidAcre.min : pricing.lawnAerationCoreAcre.min); a_max = aerationArea * (aerationType === 'liquid' ? pricing.lawnAerationLiquidAcre.max : pricing.lawnAerationCoreAcre.max); }
                else { a_min = aerationArea * (aerationType === 'liquid' ? pricing.lawnAerationLiquidSqFt.min : pricing.lawnAerationCoreSqFt.min); a_max = aerationArea * (aerationType === 'liquid' ? pricing.lawnAerationLiquidSqFt.max : pricing.lawnAerationCoreSqFt.max); }
                costMin += a_min; costMax += a_max;
            }
            if (getElementValue('lawnDethatching')) { const dethatchingCost = getCostForLawnAreaService('lawnDethatchingArea', pricing.dethatchingSqFt, pricing.dethatchingAcre); costMin += dethatchingCost.min; costMax += dethatchingCost.max; }
            if (getElementValue('lawnFertilization')) { const fertilizationCost = getCostForLawnAreaService('lawnFertilizationArea', pricing.fertilizationSqFt, pricing.fertilizationAcre); costMin += fertilizationCost.min; costMax += fertilizationCost.max; }
            if (getElementValue('lawnMulchCleanUp')) { const amount = getElementValue('lawnMulchCleanUpAmount'); costMin += amount * pricing.mulchCleanUpBags.min; costMax += amount * pricing.mulchCleanUpBags.max; }
            if (getElementValue('lawnSeeding')) { const seedingCost = getCostForLawnAreaService('lawnSeedingArea', pricing.seedingSqFt, pricing.seedingAcre); costMin += seedingCost.min; costMax += seedingCost.max; }
            if (getElementValue('lawnLeafRemoval')) { const hours = getElementValue('lawnLeafRemovalHours'); costMin += hours * pricing.leafRemovalHours.min; costMax += hours * pricing.leafRemovalHours.max; }
            if (getElementValue('lawnYardCleanup')) { const hours = getElementValue('lawnYardCleanupHours'); costMin += hours * pricing.yardCleanupHours.min; costMax += hours * pricing.yardCleanupHours.max; }
            if (getElementValue('lawnWeedControl')) { const weedControlCost = getCostForLawnAreaService('lawnWeedControlArea', pricing.weedControlSqFt, pricing.weedControlAcre); costMin += weedControlCost.min; costMax += weedControlCost.max; }
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            document.getElementById('lawnAreaToggle').addEventListener('change', this.initDisplay); // Calls initDisplay for toggle visuals
            
            const lawnServiceElementsMapping = {
                lawnMowing: { checkboxId: 'lawnMowing', inputsDivId: 'lawnMowingInputs', areaInputId: 'lawnMowingArea' },
                lawnAeration: { checkboxId: 'lawnAeration', inputsDivId: 'lawnAerationInputs', typeSelectId: 'lawnAerationType', areaInputId: 'lawnAerationArea' },
                lawnDethatching: { checkboxId: 'lawnDethatching', inputsDivId: 'lawnDethatchingInputs', areaInputId: 'lawnDethatchingArea' },
                lawnFertilization: { checkboxId: 'lawnFertilization', inputsDivId: 'lawnFertilizationInputs', areaInputId: 'lawnFertilizationArea' },
                lawnMulchCleanUp: { checkboxId: 'lawnMulchCleanUp', inputsDivId: 'lawnMulchCleanUpInputs', amountInputId: 'lawnMulchCleanUpAmount' },
                lawnSeeding: { checkboxId: 'lawnSeeding', inputsDivId: 'lawnSeedingInputs', areaInputId: 'lawnSeedingArea' },
                lawnLeafRemoval: { checkboxId: 'lawnLeafRemoval', inputsDivId: 'lawnLeafRemovalInputs', hoursInputId: 'lawnLeafRemovalHours' },
                lawnYardCleanup: { checkboxId: 'lawnYardCleanup', inputsDivId: 'lawnYardCleanupInputs', hoursInputId: 'lawnYardCleanupHours' },
                lawnWeedControl: { checkboxId: 'lawnWeedControl', inputsDivId: 'lawnWeedControlInputs', areaInputId: 'lawnWeedControlArea' }
            };

            Object.values(lawnServiceElementsMapping).forEach(service => {
                const checkbox = document.getElementById(service.checkboxId);
                const inputsDiv = document.getElementById(service.inputsDivId);
                const areaInput = service.areaInputId ? document.getElementById(service.areaInputId) : null;
                const typeSelect = service.typeSelectId ? document.getElementById(service.typeSelectId) : null;
                const amountInput = service.amountInputId ? document.getElementById(service.amountInputId) : null;
                const hoursInput = service.hoursInputId ? document.getElementById(service.hoursInputId) : null;

                if (checkbox && inputsDiv) {
                    checkbox.addEventListener('change', function() {
                        inputsDiv.style.display = this.checked ? 'block' : 'none';
                        if (!this.checked) {
                            if (areaInput) areaInput.value = 0;
                            if (amountInput) amountInput.value = 0;
                            if (hoursInput) hoursInput.value = 0;
                        }
                        calculateOverallCost();
                    });
                    if (areaInput) areaInput.addEventListener('input', calculateOverallCost);
                    if (typeSelect) typeSelect.addEventListener('change', calculateOverallCost);
                    if (amountInput) amountInput.addEventListener('input', calculateOverallCost);
                    if (hoursInput) hoursInput.addEventListener('input', calculateOverallCost);
                }
            });
        },
        initDisplay: function() {
            this.state.isAcresMode = document.getElementById('lawnAreaToggle').checked;
            const isAcresMode = this.state.isAcresMode;
            const sqFtLabel = document.getElementById('lawnSqFtLabel');
            const acresLabel = document.getElementById('lawnAcresLabel');

            if (isAcresMode) { acresLabel.classList.add('rg-calc-active-toggle-text'); sqFtLabel.classList.remove('rg-calc-active-toggle-text'); }
            else { sqFtLabel.classList.add('rg-calc-active-toggle-text'); acresLabel.classList.remove('rg-calc-active-toggle-text'); }

            const unitElements = document.querySelectorAll('#lawn-care-form .rg-calc-unit');
            unitElements.forEach(unitSpan => {
                const currentValInput = unitSpan.previousElementSibling;
                if (currentValInput) {
                    let currentVal = parseFloat(currentValInput.value) || 0;
                    if (isAcresMode) { unitSpan.textContent = 'acres'; if (unitSpan.dataset.baseUnit === 'sq.ft') { currentValInput.value = (currentVal / SQFT_PER_ACRE).toFixed(2); } currentValInput.min = "0.01"; }
                    else { unitSpan.textContent = 'sq.ft'; if (unitSpan.dataset.baseUnit === 'acres') { currentValInput.value = Math.round(currentVal * SQFT_PER_ACRE); } currentValInput.min = "0"; }
                }
            });
            
            // Set initial visibility for dynamic input divs based on their checkboxes
            const lawnServiceElementsMapping = {
                lawnMowing: 'lawnMowingInputs', lawnAeration: 'lawnAerationInputs', dethatching: 'lawnDethatchingInputs', fertilization: 'lawnFertilizationInputs', mulchCleanUp: 'lawnMulchCleanUpInputs', seeding: 'lawnSeedingInputs', leafRemoval: 'lawnLeafRemovalInputs', yardCleanup: 'lawnYardCleanupInputs', weedControl: 'lawnWeedControlInputs'
            };
            Object.keys(lawnServiceElementsMapping).forEach(serviceKey => {
                const checkbox = document.getElementById(serviceKey);
                const inputsDiv = document.getElementById(lawnServiceElementsMapping[serviceKey]);
                if (checkbox && inputsDiv) {
                    inputsDiv.style.display = checkbox.checked ? 'block' : 'none';
                }
            });
        }
    },
    'painting': {
        state: { areaValue: 1000, numRooms: 1, isRoomsMode: false },
        pricing: {
            basePerSqFt: { interior: { min: 2, max: 4 }, exterior: { min: 2.5, max: 5 }, both: { min: 4, max: 8 } },
            basePerRoom: { interior: { min: 300, max: 700 }, exterior: { min: 500, max: 1000 }, both: { min: 800, max: 1500 } },
            coatsFactor: { '1': { min: 0.8, max: 0.9 }, '2': { min: 1, max: 1 }, '3': { min: 1.2, max: 1.5 } },
            paintQualityFactor: { standard: { min: 1, max: 1 }, premium: { min: 1.2, max: 1.5 }, eco: { min: 1.3, max: 1.6 } },
            addOns: { wallPrep: { min: 0.5, max: 1 }, trimPainting: { min: 0.3, max: 0.7 }, ceilingPainting: { min: 0.7, max: 1.2 }, deckStaining: { min: 1.5, max: 3 } }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing;
            state.isRoomsMode = getElementValue('paintingAreaToggle');
            const currentAreaOrRooms = getElementValue('paintingAreaValue');
            const serviceType = getElementValue('paintingServiceType');
            const numCoats = getElementValue('paintingNumCoats');
            const paintQuality = getElementValue('paintingPaintQuality');
            let baseMin = 0; let baseMax = 0;

            if (state.isRoomsMode) { state.numRooms = currentAreaOrRooms; baseMin = pricing.basePerRoom[serviceType].min * state.numRooms; baseMax = pricing.basePerRoom[serviceType].max * state.numRooms; }
            else { state.areaValue = currentAreaOrRooms; baseMin = pricing.basePerSqFt[serviceType].min * state.areaValue; baseMax = pricing.basePerSqFt[serviceType].max * state.areaValue; }
            
            baseMin *= pricing.coatsFactor[numCoats].min; baseMax *= pricing.coatsFactor[numCoats].max;
            baseMin *= pricing.paintQualityFactor[paintQuality].min; baseMax *= pricing.paintQualityFactor[paintQuality].max;
            costMin += baseMin; costMax += baseMax;
            
            if (getElementValue('paintingWallPrep')) { if (state.isRoomsMode) { costMin += state.numRooms * 150 * pricing.addOns.wallPrep.min; costMax += state.numRooms * 150 * pricing.addOns.wallPrep.max; } else { costMin += state.areaValue * pricing.addOns.wallPrep.min; costMax += state.areaValue * pricing.addOns.wallPrep.max; } }
            if (getElementValue('paintingTrimPainting')) { if (state.isRoomsMode) { costMin += state.numRooms * 100 * pricing.addOns.trimPainting.min; costMax += state.numRooms * 100 * pricing.addOns.trimPainting.max; } else { costMin += state.areaValue * pricing.addOns.trimPainting.min; costMax += state.areaValue * pricing.addOns.trimPainting.max; } }
            if (getElementValue('paintingCeilingPainting')) { if (state.isRoomsMode) { costMin += state.numRooms * 200 * pricing.addOns.ceilingPainting.min; costMax += state.numRooms * 200 * pricing.addOns.ceilingPainting.max; } else { costMin += state.areaValue * pricing.addOns.ceilingPainting.min; costMax += state.areaValue * pricing.addOns.ceilingPainting.max; } }
            if (getElementValue('paintingDeckStaining')) { if (state.isRoomsMode) { costMin += state.numRooms * 100 * pricing.addOns.deckStaining.min; costMax += state.numRooms * 100 * pricing.addOns.deckStaining.max; } else { costMin += state.areaValue * pricing.addOns.deckStaining.min; costMax += state.areaValue * pricing.addOns.deckStaining.max; } }
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            document.getElementById('paintingAreaToggle').addEventListener('change', this.initDisplay);
            document.getElementById('paintingAreaValue').addEventListener('input', calculateOverallCost);
            document.getElementById('paintingServiceType').addEventListener('change', calculateOverallCost);
            document.getElementById('paintingNumCoats').addEventListener('change', calculateOverallCost);
            document.getElementById('paintingPaintQuality').addEventListener('change', calculateOverallCost);
            document.getElementById('paintingWallPrep').addEventListener('change', calculateOverallCost);
            document.getElementById('paintingTrimPainting').addEventListener('change', calculateOverallCost);
            document.getElementById('paintingCeilingPainting').addEventListener('change', calculateOverallCost);
            document.getElementById('paintingDeckStaining').addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const paintingAreaToggle = document.getElementById('paintingAreaToggle');
            const paintingSqFtLabel = document.getElementById('paintingSqFtLabel');
            const paintingRoomsLabel = document.getElementById('paintingRoomsLabel');
            const paintingAreaLabel = document.getElementById('paintingAreaLabel');
            const paintingAreaUnitSpan = document.getElementById('paintingAreaUnit');
            const paintingAreaValueInput = document.getElementById('paintingAreaValue'); // Re-get for access

            this.state.isRoomsMode = paintingAreaToggle.checked;
            if (this.state.isRoomsMode) {
                paintingRoomsLabel.classList.add('rg-calc-active-toggle-text'); paintingSqFtLabel.classList.remove('rg-calc-active-toggle-text');
                paintingAreaLabel.textContent = 'Number of Rooms:'; paintingAreaUnitSpan.textContent = 'rooms';
                paintingAreaValueInput.value = this.state.numRooms; paintingAreaValueInput.min = "1";
            } else {
                paintingSqFtLabel.classList.add('rg-calc-active-toggle-text'); paintingRoomsLabel.classList.remove('rg-calc-active-toggle-text');
                paintingAreaLabel.textContent = 'Area (Sq.Ft.):'; paintingAreaUnitSpan.textContent = 'sq.ft';
                paintingAreaValueInput.value = this.state.areaValue; paintingAreaValueInput.min = "1";
            }
        }
    },
    'recycling': {
        state: { numStandardBins: 0 },
        pricing: {
            standardBin: { 'oneTime': { min: 20, max: 35 }, 'weekly': { min: 10, max: 15 }, 'biWeekly': { min: 15, max: 25 }, 'monthly': { min: 25, max: 40 } },
            specialtyItems: { appliance: { min: 50, max: 100 }, electronics: { min: 15, max: 50 }, tires: { min: 10, max: 25 }, furniture: { min: 40, max: 80 } },
            additionalServices: { documentShredding: { min: 75, max: 150 }, hazardousWaste: { min: 100, max: 300 } }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const pricing = this.pricing;
            const frequency = getElementValue('recyclingPickupFrequency');
            const numBins = getElementValue('recyclingNumStandardBinsValue');

            if (numBins > 0) {
                const binCost = pricing.standardBin[frequency];
                if (binCost) { costMin += numBins * binCost.min; costMax += numBins * binCost.max; }
            }
            if (getElementValue('recyclingRemoveAppliance')) { const qty = getElementValue('recyclingNumAppliances'); costMin += qty * pricing.specialtyItems.appliance.min; costMax += qty * pricing.specialtyItems.appliance.max; }
            if (getElementValue('recyclingRemoveElectronics')) { const qty = getElementValue('recyclingNumElectronics'); costMin += qty * pricing.specialtyItems.electronics.min; costMax += qty * pricing.specialtyItems.electronics.max; }
            if (getElementValue('recyclingRemoveTires')) { const qty = getElementValue('recyclingNumTires'); costMin += qty * pricing.specialtyItems.tires.min; costMax += qty * pricing.specialtyItems.tires.max; }
            if (getElementValue('recyclingRemoveFurniture')) { const qty = getElementValue('recyclingNumFurniture'); costMin += qty * pricing.specialtyItems.furniture.min; costMax += qty * pricing.specialtyItems.furniture.max; }
            if (getElementValue('recyclingDocumentShredding')) { costMin += pricing.additionalServices.documentShredding.min; costMax += pricing.additionalServices.documentShredding.max; }
            if (getElementValue('recyclingHazardousWaste')) { costMin += pricing.additionalServices.hazardousWaste.min; costMax += pricing.additionalServices.hazardousWaste.max; }
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            document.getElementById('recyclingPickupFrequency').addEventListener('change', calculateOverallCost);
            setupAddonVisibility('recyclingRemoveAppliance', 'recyclingApplianceInputs', 'recyclingNumAppliances');
            setupAddonVisibility('recyclingRemoveElectronics', 'recyclingElectronicsInputs', 'recyclingNumElectronics');
            setupAddonVisibility('recyclingRemoveTires', 'recyclingTiresInputs', 'recyclingNumTires');
            setupAddonVisibility('recyclingRemoveFurniture', 'recyclingFurnitureInputs', 'recyclingNumFurniture');
            document.getElementById('recyclingDocumentShredding').addEventListener('change', calculateOverallCost);
            document.getElementById('recyclingHazardousWaste').addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            document.getElementById('recyclingApplianceInputs').classList.toggle('hidden', !document.getElementById('recyclingRemoveAppliance').checked);
            document.getElementById('recyclingElectronicsInputs').classList.toggle('hidden', !document.getElementById('recyclingRemoveElectronics').checked);
            document.getElementById('recyclingTiresInputs').classList.toggle('hidden', !document.getElementById('recyclingRemoveTires').checked);
            document.getElementById('recyclingFurnitureInputs').classList.toggle('hidden', !document.getElementById('recyclingRemoveFurniture').checked);
        }
    },
    'window-cleaning': {
        state: { numStandardWindows: 0, numFrenchPanes: 0, numSlidingDoors: 0, numScreens: 0, numHardWaterWindows: 0, numSkylights: 0 },
        pricing: {
            baseCosts: { standardWindow: { min: 8, max: 15 }, frenchPane: { min: 3, max: 6 }, slidingDoor: { min: 20, max: 40 } },
            storyHeightMultipliers: { '1': { min: 1.0, max: 1.0 }, '2': { min: 1.2, max: 1.4 }, '3': { min: 1.5, max: 2.0 } },
            cleaningTypeAdjustments: { 'interior-exterior': { min: 1.0, max: 1.0 }, 'exterior-only': { min: 0.6, max: 0.7 } },
            addOns: { screenCleaning: { min: 3, max: 8 }, trackCleaning: { min: 50, max: 100 }, hardWaterStainRemoval: { min: 10, max: 30 }, skylightCleaning: { min: 30, max: 70 } }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing;
            state.numStandardWindows = getElementValue('windowNumStandardWindowsValue');
            state.numFrenchPanes = getElementValue('windowNumFrenchPanesValue');
            state.numSlidingDoors = getElementValue('windowNumSlidingDoorsValue');
            state.numScreens = getElementValue('windowNumScreens');
            state.numHardWaterWindows = getElementValue('windowNumHardWaterWindows');
            state.numSkylights = getElementValue('windowNumSkylights');

            const storyHeight = getElementValue('windowStoryHeight');
            const cleaningType = getElementValue('windowCleaningType');

            let baseWindowCostMin = (state.numStandardWindows * pricing.baseCosts.standardWindow.min) + (state.numFrenchPanes * pricing.baseCosts.frenchPane.min) + (state.numSlidingDoors * pricing.baseCosts.slidingDoor.min);
            let baseWindowCostMax = (state.numStandardWindows * pricing.baseCosts.standardWindow.max) + (state.numFrenchPanes * pricing.baseCosts.frenchPane.max) + (state.numSlidingDoors * pricing.baseCosts.slidingDoor.max);
            
            baseWindowCostMin *= pricing.storyHeightMultipliers[storyHeight].min; baseWindowCostMax *= pricing.storyHeightMultipliers[storyHeight].max;
            baseWindowCostMin *= pricing.cleaningTypeAdjustments[cleaningType].min; baseWindowCostMax *= pricing.cleaningTypeAdjustments[cleaningType].max;
            costMin += baseWindowCostMin; costMax += baseWindowCostMax;
            
            if (getElementValue('windowScreenCleaningCheckbox')) { totalCostMin += state.numScreens * pricing.addOns.screenCleaning.min; totalCostMax += state.numScreens * pricing.addOns.screenCleaning.max; }
            if (getElementValue('windowTrackCleaningCheckbox')) { totalCostMin += pricing.addOns.trackCleaning.min; totalCostMax += pricing.addOns.trackCleaning.max; }
            if (getElementValue('windowHardWaterCheckbox')) { totalCostMin += state.numHardWaterWindows * pricing.addOns.hardWaterStainRemoval.min; totalCostMax += state.numHardWaterWindows * pricing.addOns.hardWaterStainRemoval.max; }
            if (getElementValue('windowSkylightCleaningCheckbox')) { totalCostMin += state.numSkylights * pricing.addOns.skylightCleaning.min; totalCostMax += state.numSkylights * pricing.addOns.skylightCleaning.max; }
            return { min: totalCostMin, max: totalCostMax };
        },
        initListeners: function() {
            document.getElementById('windowStoryHeight').addEventListener('change', calculateOverallCost);
            document.getElementById('windowCleaningType').addEventListener('change', calculateOverallCost);
            setupAddonVisibility('windowScreenCleaningCheckbox', 'windowScreenCleaningInputs', 'windowNumScreens');
            document.getElementById('windowTrackCleaningCheckbox').addEventListener('change', calculateOverallCost);
            setupAddonVisibility('windowHardWaterCheckbox', 'windowHardWaterInputs', 'windowNumHardWaterWindows');
            setupAddonVisibility('windowSkylightCleaningCheckbox', 'windowSkylightCleaningInputs', 'windowNumSkylights');
        },
        initDisplay: function() {
            document.getElementById('windowScreenCleaningInputs').classList.toggle('hidden', !document.getElementById('windowScreenCleaningCheckbox').checked);
            document.getElementById('windowHardWaterInputs').classList.toggle('hidden', !document.getElementById('windowHardWaterCheckbox').checked);
            document.getElementById('windowSkylightCleaningInputs').classList.toggle('hidden', !document.getElementById('windowSkylightCleaningCheckbox').checked);
        }
    },
    'pooper-scooper': {
        state: { numDogs: 1 },
        pricing: {
            baseRates: { 'weekly': { min: 15, max: 25 }, 'biWeekly': { min: 20, max: 35 }, 'twiceWeekly': { min: 10, max: 20 }, 'oneTime': { min: 0, max: 0 } },
            perDogMultiplier: { min: 5, max: 10 }, yardSizeMultipliers: { 'small': { min: 1.0, max: 1.0 }, 'medium': { min: 1.2, max: 1.4 }, 'large': { min: 1.5, max: 1.8 }, 'extraLarge': { min: 2.0, max: 2.5 } },
            oneTimeCleanupCondition: { 'average': { min: 60, max: 100 }, 'moderate': { min: 100, max: 150 }, 'severe': { min: 150, max: 250 } },
            addOns: { wasteHauling: { min: 5, max: 15 }, yardDeodorizing: { min: 15, max: 30 }, patioHosing: { min: 10, max: 25 } }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing;
            const frequency = getElementValue('pooperScooperServiceFrequency');
            const yardSize = getElementValue('pooperScooperYardSize');
            const initialCleanupCondition = getElementValue('pooperScooperInitialCleanupCondition');
            state.numDogs = getElementValue('pooperScooperNumDogsValue');

            if (frequency === 'oneTime') {
                const conditionCost = pricing.oneTimeCleanupCondition[initialCleanupCondition];
                if (conditionCost) { costMin += conditionCost.min; costMax += conditionCost.max; }
                const yardMultiplier = pricing.yardSizeMultipliers[yardSize];
                costMin *= yardMultiplier.min; costMax *= yardMultiplier.max;
                if (state.numDogs > 1) { costMin += (state.numDogs - 1) * pricing.perDogMultiplier.min * 0.5; costMax += (state.numDogs - 1) * pricing.perDogMultiplier.max * 0.5; }
            } else {
                const baseRate = pricing.baseRates[frequency];
                if (baseRate) {
                    let rateMin = baseRate.min; let rateMax = baseRate.max;
                    const yardMultiplier = pricing.yardSizeMultipliers[yardSize];
                    rateMin *= yardMultiplier.min; rateMax *= yardMultiplier.max;
                    costMin += rateMin; costMax += rateMax;
                }
                if (state.numDogs > 1) { const additionalDogCostMin = (state.numDogs - 1) * pricing.perDogMultiplier.min; const additionalDogCostMax = (state.numDogs - 1) * pricing.perDogMultiplier.max; costMin += additionalDogCostMin; costMax += additionalDogCostMax; }
            }
            if (getElementValue('pooperScooperWasteHauling')) { costMin += pricing.addOns.wasteHauling.min; costMax += pricing.addOns.wasteHauling.max; }
            if (getElementValue('pooperScooperYardDeodorizing')) { costMin += pricing.addOns.yardDeodorizing.min; costMax += pricing.addOns.yardDeodorizing.max; }
            if (getElementValue('pooperScooperPatioHosing')) { costMin += pricing.addOns.patioHosing.min; costMax += pricing.addOns.patioHosing.max; }
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            document.getElementById('pooperScooperServiceFrequency').addEventListener('change', this.initDisplay);
            document.getElementById('pooperScooperYardSize').addEventListener('change', calculateOverallCost);
            document.getElementById('pooperScooperInitialCleanupCondition').addEventListener('change', calculateOverallCost);
            document.getElementById('pooperScooperWasteHauling').addEventListener('change', calculateOverallCost);
            document.getElementById('pooperScooperYardDeodorizing').addEventListener('change', calculateOverallCost);
            document.getElementById('pooperScooperPatioHosing').addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const frequency = document.getElementById('pooperScooperServiceFrequency').value;
            const yardSizeGroup = document.getElementById('pooperScooperYardSizeGroup');
            const initialCleanupConditionGroup = document.getElementById('pooperScooperInitialCleanupConditionGroup');
            if (frequency === 'oneTime') { yardSizeGroup.classList.add('hidden'); initialCleanupConditionGroup.classList.remove('hidden'); }
            else { yardSizeGroup.classList.remove('hidden'); initialCleanupConditionGroup.classList.add('hidden'); }
        }
    },
    'property-maintenance': {
        state: { estimatedHours: 1 },
        pricing: {
            propertyTypeMultipliers: { 'smallResidential': { min: 0.8, max: 1.0 }, 'mediumResidential': { min: 1.0, max: 1.2 }, 'largeResidential': { min: 1.3, max: 1.6 }, 'smallCommercial': { min: 1.5, max: 2.0 } },
            frequencyAdjustments: { 'oneTime': { min: 1.0, max: 1.0 }, 'weekly': { min: 0.8, max: 0.9 }, 'monthly': { min: 0.9, max: 1.0 }, 'quarterly': { min: 1.0, max: 1.1 }, 'annually': { min: 1.1, max: 1.2 } },
            hourlyRate: { min: 50, max: 90 },
            addOns: { gutterCleaning: { min: 100, max: 250 }, basicLandscaping: { min: 75, max: 150 }, filterReplacement: { min: 20, max: 50 }, pressureWashingSmall: { min: 80, max: 180 }, minorPlumbing: { min: 75, max: 150 }, minorElectrical: { min: 75, max: 150 } },
            minimumJobFee: { min: 100, max: 250 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing;
            const propertyType = getElementValue('propertyMaintenancePropertyType');
            const serviceFrequency = getElementValue('propertyMaintenanceServiceFrequency');
            state.estimatedHours = getElementValue('propertyMaintenanceEstimatedHoursValue');
            const hourlyRate = getElementValue('propertyMaintenanceHourlyRate');

            costMin += state.estimatedHours * hourlyRate; costMax += state.estimatedHours * hourlyRate;
            costMin *= pricing.propertyTypeMultipliers[propertyType].min; costMax *= pricing.propertyTypeMultipliers[propertyType].max;
            if (serviceFrequency !== 'oneTime') {
                costMin *= pricing.frequencyAdjustments[serviceFrequency].min; costMax *= pricing.frequencyAdjustments[serviceFrequency].max;
            } else {
                costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            }
            if (getElementValue('propertyMaintenanceGutterCleaning')) { costMin += pricing.addOns.gutterCleaning.min; costMax += pricing.addOns.gutterCleaning.max; }
            if (getElementValue('propertyMaintenanceBasicLandscaping')) { costMin += pricing.addOns.basicLandscaping.min; costMax += pricing.addOns.basicLandscaping.max; }
            if (getElementValue('propertyMaintenanceFilterReplacement')) { costMin += pricing.addOns.filterReplacement.min; costMax += pricing.addOns.filterReplacement.max; }
            if (getElementValue('propertyMaintenancePressureWashingSmall')) { costMin += pricing.addOns.pressureWashingSmall.min; costMax += pricing.addOns.pressureWashingSmall.max; }
            if (getElementValue('propertyMaintenanceMinorPlumbing')) { costMin += pricing.addOns.minorPlumbing.min; costMax += pricing.addOns.minorPlumbing.max; }
            if (getElementValue('propertyMaintenanceMinorElectrical')) { costMin += pricing.addOns.minorElectrical.min; costMax += pricing.addOns.minorElectrical.max; }
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            document.getElementById('propertyMaintenancePropertyType').addEventListener('change', calculateOverallCost);
            document.getElementById('propertyMaintenanceServiceFrequency').addEventListener('change', calculateOverallCost);
            document.getElementById('propertyMaintenanceHourlyRate').addEventListener('input', calculateOverallCost);
            document.getElementById('propertyMaintenanceGutterCleaning').addEventListener('change', calculateOverallCost);
            document.getElementById('propertyMaintenanceBasicLandscaping').addEventListener('change', calculateOverallCost);
            document.getElementById('propertyMaintenanceFilterReplacement').addEventListener('change', calculateOverallCost);
            document.getElementById('propertyMaintenancePressureWashingSmall').addEventListener('change', calculateOverallCost);
            document.getElementById('propertyMaintenanceMinorPlumbing').addEventListener('change', calculateOverallCost);
            document.getElementById('propertyMaintenanceMinorElectrical').addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            // No specific initial hidden elements for this one beyond standard add-ons
        }
    },
    'pool-spa': {
        state: {}, // No specific state variables needed beyond inputs
        pricing: {
            baseRates: { // Monthly recurring rates for weekly service, adjust based on type and size
                'ingroundPool': { 'small': { min: 100, max: 150 }, 'medium': { min: 150, max: 200 }, 'large': { min: 200, max: 280 } },
                'abovegroundPool': { 'small': { min: 80, max: 120 }, 'medium': { min: 100, max: 150 }, 'large': { min: 120, max: 180 } },
                'hotTubSpa': { min: 60, max: 100 }
            },
            frequencyAdjustments: { 'weekly': { min: 1.0, max: 1.0 }, 'biWeekly': { min: 0.7, max: 0.8 }, 'monthly': { min: 0.5, max: 0.6 }, 'oneTime': { min: 0, max: 0 } },
            oneTimeCleanup: { 'ingroundPool': { min: 150, max: 300 }, 'abovegroundPool': { min: 100, max: 200 }, 'hotTubSpa': { min: 80, max: 150 } },
            addOns: { poolOpening: { min: 200, max: 350 }, poolClosing: { min: 200, max: 350 }, filterCleaning: { min: 50, max: 100 }, algaeTreatment: { min: 75, max: 200 }, equipmentDiagnostics: { min: 80, max: 150 }, saltCellCleaning: { min: 70, max: 120 } }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const pricing = this.pricing;
            const poolSpaType = getElementValue('poolSpaType');
            const poolSize = getElementValue('poolSize');
            const serviceFrequency = getElementValue('poolSpaServiceFrequency');

            if (serviceFrequency === 'oneTime') {
                const oneTimeRate = pricing.oneTimeCleanup[poolSpaType];
                if (oneTimeRate) { costMin += oneTimeRate.min; costMax += oneTimeRate.max; }
                if (poolSpaType !== 'hotTubSpa') {
                    const sizeMultiplier = pricing.baseRates[poolSpaType][poolSize];
                    costMin = costMin * (sizeMultiplier ? sizeMultiplier.min/100 : 1);
                    costMax = costMax * (sizeMultiplier ? sizeMultiplier.max/100 : 1);
                }
            } else {
                let baseMonthlyRateMin = 0; let baseMonthlyRateMax = 0;
                if (poolSpaType === 'hotTubSpa') { baseMonthlyRateMin = pricing.baseRates.hotTubSpa.min; baseMonthlyRateMax = pricing.baseRates.hotTubSpa.max; }
                else { const typeRates = pricing.baseRates[poolSpaType]; const sizeRates = typeRates ? typeRates[poolSize] : null; if (sizeRates) { baseMonthlyRateMin = sizeRates.min; baseMonthlyRateMax = sizeRates.max; } }
                const freqAdj = pricing.frequencyAdjustments[serviceFrequency];
                if (freqAdj) { costMin += baseMonthlyRateMin * freqAdj.min; costMax += baseMonthlyRateMax * freqAdj.max; }
            }
            if (getElementValue('poolSpaOpeningClosing')) {
                const ocType = getElementValue('poolSpaOpeningClosingType');
                if (ocType === 'opening' || ocType === 'both') { costMin += pricing.addOns.poolOpening.min; costMax += pricing.addOns.poolOpening.max; }
                if (ocType === 'closing' || ocType === 'both') { costMin += pricing.addOns.poolClosing.min; costMax += pricing.addOns.poolClosing.max; }
            }
            if (getElementValue('poolSpaFilterCleaning')) { costMin += pricing.addOns.filterCleaning.min; costMax += pricing.addOns.filterCleaning.max; }
            if (getElementValue('poolSpaAlgaeTreatment')) { costMin += pricing.addOns.algaeTreatment.min; costMax += pricing.addOns.algaeTreatment.max; }
            if (getElementValue('poolSpaEquipmentDiagnostics')) { costMin += pricing.addOns.equipmentDiagnostics.min; costMax += pricing.addOns.equipmentDiagnostics.max; }
            if (getElementValue('poolSpaSaltCellCleaning')) { costMin += pricing.addOns.saltCellCleaning.min; costMax += pricing.addOns.saltCellCleaning.max; }
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            document.getElementById('poolSpaType').addEventListener('change', calculateOverallCost);
            document.getElementById('poolSize').addEventListener('change', calculateOverallCost);
            document.getElementById('poolSpaServiceFrequency').addEventListener('change', calculateOverallCost);
            setupAddonVisibility('poolSpaOpeningClosing', 'poolSpaOpeningClosingInputs', 'poolSpaOpeningClosingType'); // Use the type select as the "quantity" element
            document.getElementById('poolSpaOpeningClosingType').addEventListener('change', calculateOverallCost); // Listener for type select
            document.getElementById('poolSpaFilterCleaning').addEventListener('change', calculateOverallCost);
            document.getElementById('poolSpaAlgaeTreatment').addEventListener('change', calculateOverallCost);
            document.getElementById('poolSpaEquipmentDiagnostics').addEventListener('change', calculateOverallCost);
            document.getElementById('poolSpaSaltCellCleaning').addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            document.getElementById('poolSpaOpeningClosingInputs').classList.toggle('hidden', !document.getElementById('poolSpaOpeningClosing').checked);
        }
    },
    'pressure-washing': {
        state: { areaValue: 500, hourlyValue: 1 },
        pricing: {
            baseRatesPerSqFt: { 'driveway': { min: 0.15, max: 0.25 }, 'patio': { min: 0.18, max: 0.28 }, 'siding': { min: 0.20, max: 0.40 }, 'deck': { min: 0.30, max: 0.60 }, 'fence': { min: 0.25, max: 0.50 }, 'roof': { min: 0.40, max: 0.80 }, 'other': { min: 0, max: 0 } },
            hourlyRate: { min: 70, max: 120 }, conditionMultipliers: { 'light': { min: 1.0, max: 1.0 }, 'moderate': { min: 1.2, max: 1.4 }, 'heavy': { min: 1.5, max: 2.0 } },
            storyHeightMultipliers: { '1': { min: 1.0, max: 1.0 }, '2': { min: 1.15, max: 1.35 }, '3': { min: 1.4, max: 1.8 } },
            materialAdjustments: { 'concrete': { min: 1.0, max: 1.0 }, 'wood': { min: 1.1, max: 1.2 }, 'vinyl': { min: 1.0, max: 1.0 }, 'stucco': { min: 1.2, max: 1.3 }, 'asphaltShingle': { min: 1.0, max: 1.0 }, 'tile': { min: 1.1, max: 1.2 } },
            addOns: { sealing: { min: 0.50, max: 1.00 }, gutterBrightening: { min: 75, max: 150 }, moldMildewTreatment: { min: 50, max: 120 } },
            minimumJobFee: { min: 100, max: 250 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing;
            const surfaceType = getElementValue('pressureWashingSurfaceType');
            state.areaValue = getElementValue('pressureWashingAreaValue');
            state.hourlyValue = getElementValue('pressureWashingHourlyValue');
            const materialType = getElementValue('pressureWashingMaterialType');
            const dirtCondition = getElementValue('pressureWashingDirtCondition');
            const storyHeight = getElementValue('pressureWashingStoryHeight');

            let baseMin = 0; let baseMax = 0;
            if (surfaceType === 'other') { baseMin = state.hourlyValue * pricing.hourlyRate.min; baseMax = state.hourlyValue * pricing.hourlyRate.max; }
            else {
                baseMin = state.areaValue * pricing.baseRatesPerSqFt[surfaceType].min; baseMax = state.areaValue * pricing.baseRatesPerSqFt[surfaceType].max;
                baseMin *= pricing.conditionMultipliers[dirtCondition].min; baseMax *= pricing.conditionMultipliers[dirtCondition].max;
                if (surfaceType === 'siding' || surfaceType === 'roof') { baseMin *= pricing.storyHeightMultipliers[storyHeight].min; baseMax *= pricing.storyHeightMultipliers[storyHeight].max; }
                baseMin *= pricing.materialAdjustments[materialType].min; baseMax *= pricing.materialAdjustments[materialType].max;
            }
            costMin += baseMin; costMax += baseMax;
            if (getElementValue('pressureWashingSealingCheckbox')) { const sealingArea = (surfaceType === 'driveway' || surfaceType === 'patio' || surfaceType === 'deck') ? state.areaValue : 0; costMin += sealingArea * pricing.addOns.sealing.min; costMax += sealingArea * pricing.addOns.sealing.max; }
            if (getElementValue('pressureWashingGutterBrighteningCheckbox')) { costMin += pricing.addOns.gutterBrightening.min; costMax += pricing.addOns.gutterBrightening.max; }
            if (getElementValue('pressureWashingMoldMildewTreatmentCheckbox')) { costMin += pricing.addOns.moldMildewTreatment.min; costMax += pricing.addOns.moldMildewTreatment.max; }
            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const surfaceTypeSelect = document.getElementById('pressureWashingSurfaceType');
            surfaceTypeSelect.addEventListener('change', this.initDisplay); // Calls initDisplay for visibility
            document.getElementById('pressureWashingAreaValue').addEventListener('input', calculateOverallCost);
            document.getElementById('pressureWashingHourlyValue').addEventListener('input', calculateOverallCost);
            document.getElementById('pressureWashingMaterialType').addEventListener('change', calculateOverallCost);
            document.getElementById('pressureWashingDirtCondition').addEventListener('change', calculateOverallCost);
            document.getElementById('pressureWashingStoryHeight').addEventListener('change', calculateOverallCost);
            document.getElementById('pressureWashingSealingCheckbox').addEventListener('change', calculateOverallCost);
            document.getElementById('pressureWashingGutterBrighteningCheckbox').addEventListener('change', calculateOverallCost);
            document.getElementById('pressureWashingMoldMildewTreatmentCheckbox').addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const currentSurfaceType = getElementValue('pressureWashingSurfaceType');
            const areaInputGroup = document.getElementById('pressureWashingAreaInputGroup');
            const hourlyInputGroup = document.getElementById('pressureWashingHourlyInputGroup');
            const materialTypeGroup = document.getElementById('pressureWashingMaterialTypeGroup');
            const storyHeightGroup = document.getElementById('pressureWashingStoryHeightGroup');

            if (currentSurfaceType === 'other') {
                areaInputGroup.classList.add('hidden'); materialTypeGroup.classList.add('hidden'); storyHeightGroup.classList.add('hidden');
                hourlyInputGroup.classList.remove('hidden');
            } else {
                areaInputGroup.classList.remove('hidden'); materialTypeGroup.classList.remove('hidden'); hourlyInputGroup.classList.add('hidden');
                if (currentSurfaceType === 'siding' || currentSurfaceType === 'roof') { storyHeightGroup.classList.remove('hidden'); } else { storyHeightGroup.classList.add('hidden'); }
            }
        }
    },
    'paving': {
        state: { areaValue: 500, numPatches: 1 },
        pricing: {
            materials: { 'asphalt': { min: 2.0, max: 5.0 }, 'concrete': { min: 4.0, max: 10.0 }, 'pavers': { min: 10.0, max: 30.0 }, 'gravel': { min: 0.5, max: 2.0 } },
            serviceTypeMultipliers: { 'newInstallation': { min: 1.0, max: 1.0 }, 'resurfacing': { min: 0.5, max: 0.7 }, 'repairPatching': { min: 1.0, max: 1.0 }, 'removalReplacement': { min: 1.5, max: 2.0 } },
            thicknessMultipliers: { '2': { min: 0.8, max: 0.9 }, '3': { min: 1.0, max: 1.0 }, '4': { min: 1.2, max: 1.4 } },
            sitePrepMultipliers: { 'basic': { min: 1.0, max: 1.0 }, 'moderate': { min: 1.15, max: 1.3 }, 'extensive': { min: 1.4, max: 1.7 } },
            repairPatchCost: { min: 150, max: 300 },
            addOns: { sealcoating: { min: 0.20, max: 0.50 }, drainageSolutions: { min: 300, max: 800 }, edgingBorders: { min: 5, max: 15 }, lineStriping: { min: 200, max: 600 } },
            minimumJobFee: { min: 500, max: 1500 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing;
            const serviceType = getElementValue('pavingServiceType');
            const surfaceType = getElementValue('pavingSurfaceType');
            const material = getElementValue('pavingMaterial');
            state.areaValue = getElementValue('pavingAreaValue');
            const thickness = getElementValue('pavingThickness');
            const sitePreparation = getElementValue('pavingSitePreparation');
            state.numPatches = getElementValue('pavingNumPatchesValue');

            let basePavingMin = 0; let basePavingMax = 0;
            if (serviceType === 'repairPatching') { basePavingMin = pricing.repairPatchCost.min * state.numPatches; basePavingMax = pricing.repairPatchCost.max * state.numPatches; }
            else {
                basePavingMin = pricing.materials[material].min * state.areaValue; basePavingMax = pricing.materials[material].max * state.areaValue;
                basePavingMin *= pricing.serviceTypeMultipliers[serviceType].min; basePavingMax *= pricing.serviceTypeMultipliers[serviceType].max;
                if (material === 'asphalt' || material === 'concrete') { basePavingMin *= pricing.thicknessMultipliers[thickness].min; basePavingMax *= pricing.thicknessMultipliers[thickness].max; }
                basePavingMin *= pricing.sitePrepMultipliers[sitePreparation].min; basePavingMax *= pricing.sitePrepMultipliers[sitePreparation].max;
            }
            costMin += basePavingMin; costMax += basePavingMax;
            if (getElementValue('pavingSealcoatingCheckbox') && material === 'asphalt') { costMin += state.areaValue * pricing.addOns.sealcoating.min; costMax += state.areaValue * pricing.addOns.sealcoating.max; }
            if (getElementValue('pavingDrainageSolutionsCheckbox')) { costMin += pricing.addOns.drainageSolutions.min; costMax += pricing.addOns.drainageSolutions.max; }
            if (getElementValue('pavingEdgingBordersCheckbox')) { costMin += Math.sqrt(state.areaValue) * 4 * pricing.addOns.edgingBorders.min; costMax += Math.sqrt(state.areaValue) * 4 * pricing.addOns.edgingBorders.max; }
            if (getElementValue('pavingLineStripingCheckbox') && surfaceType === 'parkingLot') { costMin += pricing.addOns.lineStriping.min; costMax += pricing.addOns.lineStriping.max; }
            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const pavingServiceTypeSelect = document.getElementById('pavingServiceType');
            pavingServiceTypeSelect.addEventListener('change', this.initDisplay);
            document.getElementById('pavingSurfaceType').addEventListener('change', calculateOverallCost);
            const pavingMaterialSelect = document.getElementById('pavingMaterial');
            pavingMaterialSelect.addEventListener('change', this.initDisplay); // calls initDisplay to update thickness visibility
            document.getElementById('pavingAreaValue').addEventListener('input', calculateOverallCost);
            document.getElementById('pavingThickness').addEventListener('change', calculateOverallCost);
            document.getElementById('pavingSitePreparation').addEventListener('change', calculateOverallCost);
            document.getElementById('pavingSealcoatingCheckbox').addEventListener('change', calculateOverallCost);
            document.getElementById('pavingDrainageSolutionsCheckbox').addEventListener('change', calculateOverallCost);
            document.getElementById('pavingEdgingBordersCheckbox').addEventListener('change', calculateOverallCost);
            document.getElementById('pavingLineStripingCheckbox').addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const serviceType = getElementValue('pavingServiceType');
            const material = getElementValue('pavingMaterial');
            const repairPatchingGroup = document.getElementById('pavingRepairPatchingGroup');
            const areaInputGroup = document.getElementById('pavingAreaInputGroup');
            const thicknessGroup = document.getElementById('pavingThicknessGroup');

            if (serviceType === 'repairPatching') {
                repairPatchingGroup.classList.remove('hidden');
                areaInputGroup.classList.add('hidden');
                thicknessGroup.classList.add('hidden');
            } else {
                repairPatchingGroup.classList.add('hidden');
                areaInputGroup.classList.remove('hidden');
                if (material === 'asphalt' || material === 'concrete') {
                    thicknessGroup.classList.remove('hidden');
                } else {
                    thicknessGroup.classList.add('hidden');
                }
            }
        }
    },
    'installation': {
        state: { numUnits: 1, estimatedHours: 1 },
        pricing: {
            baseCosts: { 'appliance': { min: 100, max: 250 }, 'lightFixture': { min: 75, max: 150 }, 'faucetToilet': { min: 120, max: 220 }, 'tvMount': { min: 150, max: 350 }, 'shelfCabinet': { min: 80, max: 200 }, 'securityCamera': { min: 100, max: 300 }, 'other': { min: 0, max: 0 } },
            hourlyRate: { min: 60, max: 100 }, complexityMultipliers: { 'simple': { min: 1.0, max: 1.0 }, 'moderate': { min: 1.2, max: 1.5 }, 'complex': { min: 1.6, max: 2.0 } },
            addOns: { disposalOfOldItems: { min: 40, max: 100 }, minorModifications: { min: 50, max: 150 }, testingCalibration: { min: 30, max: 80 } },
            removalCost: { min: 50, max: 150 }, minimumJobFee: { min: 100, max: 250 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing;
            const type = getElementValue('installationType');
            state.numUnits = getElementValue('installationNumUnitsValue');
            state.estimatedHours = getElementValue('installationEstimatedHours');
            const complexity = getElementValue('installationComplexity');
            const removalNeeded = getElementValue('installationRemovalNeeded');

            let baseMin = 0; let baseMax = 0;
            if (type === 'other') { baseMin = state.estimatedHours * pricing.hourlyRate.min; baseMax = state.estimatedHours * pricing.hourlyRate.max; }
            else {
                baseMin = pricing.baseCosts[type].min * state.numUnits; baseMax = pricing.baseCosts[type].max * state.numUnits;
                baseMin *= pricing.complexityMultipliers[complexity].min; baseMax *= pricing.complexityMultipliers[complexity].max;
            }
            costMin += baseMin; costMax += baseMax;
            if (removalNeeded) { costMin += pricing.removalCost.min; costMax += pricing.removalCost.max; }
            if (getElementValue('installationDisposalOfOldItems')) { costMin += pricing.addOns.disposalOfOldItems.min; costMax += pricing.addOns.disposalOfOldItems.max; }
            if (getElementValue('installationMinorModifications')) { costMin += pricing.addOns.minorModifications.min; costMax += pricing.addOns.minorModifications.max; }
            if (getElementValue('installationTestingCalibration')) { costMin += pricing.addOns.testingCalibration.min; costMax += pricing.addOns.testingCalibration.max; }
            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const installationTypeSelect = document.getElementById('installationType');
            installationTypeSelect.addEventListener('change', this.initDisplay);
            document.getElementById('installationEstimatedHours').addEventListener('input', calculateOverallCost);
            document.getElementById('installationComplexity').addEventListener('change', calculateOverallCost);
            document.getElementById('installationRemovalNeeded').addEventListener('change', calculateOverallCost);
            document.getElementById('installationDisposalOfOldItems').addEventListener('change', calculateOverallCost);
            document.getElementById('installationMinorModifications').addEventListener('change', calculateOverallCost);
            document.getElementById('installationTestingCalibration').addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const type = getElementValue('installationType');
            const numUnitsGroup = document.getElementById('installationNumUnitsGroup');
            const estimatedHoursGroup = document.getElementById('installationEstimatedHoursGroup');
            if (type === 'other') { numUnitsGroup.classList.add('hidden'); estimatedHoursGroup.classList.remove('hidden'); }
            else { numUnitsGroup.classList.remove('hidden'); estimatedHoursGroup.classList.add('hidden'); }
        }
    },
    'junk-removal': {
        state: { mattresses: 0, tires: 0, heavyItems: 0, demolitionHours: 1 },
        pricing: {
            volumeRates: { 'minCharge': { min: 75, max: 150 }, 'oneEighth': { min: 100, max: 250 }, 'oneQuarter': { min: 150, max: 350 }, 'half': { min: 300, max: 600 }, 'threeQuarter': { min: 350, max: 700 }, 'full': { min: 400, max: 800 } },
            typeMultipliers: { 'general': { min: 1.0, max: 1.0 }, 'furniture': { min: 1.1, max: 1.2 }, 'appliances': { min: 1.0, max: 1.1 }, 'yardWaste': { min: 0.9, max: 1.0 }, 'construction': { min: 1.2, max: 1.5 }, 'mixed': { min: 1.0, max: 1.2 } },
            accessibilityMultipliers: { 'curbside': { min: 1.0, max: 1.0 }, 'basementAttic': { min: 1.2, max: 1.4 }, 'difficult': { min: 1.5, max: 1.8 } },
            surcharges: { mattress: { min: 25, max: 75 }, tire: { min: 10, max: 30 }, heavyItem: { min: 50, max: 150 } },
            additionalServices: { demolitionHourly: { min: 50, max: 100 }, cleanupAfter: { min: 50, max: 150 } },
            minimumJobFee: { min: 75, max: 150 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing;
            const volume = getElementValue('junkRemovalVolume');
            const type = getElementValue('junkRemovalType');
            const accessibility = getElementValue('junkRemovalAccessibility');
            
            let baseMin = pricing.volumeRates[volume].min; let baseMax = pricing.volumeRates[volume].max;
            baseMin *= pricing.typeMultipliers[type].min; baseMax *= pricing.typeMultipliers[type].max;
            baseMin *= pricing.accessibilityMultipliers[accessibility].min; baseMax *= pricing.accessibilityMultipliers[accessibility].max;
            costMin += baseMin; costMax += baseMax;

            state.mattresses = getElementValue('junkRemovalMattressesValue');
            state.tires = getElementValue('junkRemovalTiresValue');
            state.heavyItems = getElementValue('junkRemovalHeavyItemsValue');
            state.demolitionHours = getElementValue('junkRemovalDemolitionHours');

            if (getElementValue('junkRemovalMattressSurcharge')) { costMin += state.mattresses * pricing.surcharges.mattress.min; costMax += state.mattresses * pricing.surcharges.mattress.max; }
            if (getElementValue('junkRemovalTireSurcharge')) { costMin += state.tires * pricing.surcharges.tire.min; costMax += state.tires * pricing.surcharges.tire.max; }
            if (getElementValue('junkRemovalHeavyItemSurcharge')) { costMin += state.heavyItems * pricing.surcharges.heavyItem.min; costMax += state.heavyItems * pricing.surcharges.heavyItem.max; }
            if (getElementValue('junkRemovalDemolition')) { costMin += state.demolitionHours * pricing.additionalServices.demolitionHourly.min; costMax += state.demolitionHours * pricing.additionalServices.demolitionHourly.max; }
            if (getElementValue('junkRemovalCleanUpAfter')) { costMin += pricing.additionalServices.cleanupAfter.min; costMax += pricing.additionalServices.cleanupAfter.max; }

            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return {min: costMin, max: costMax};
        },
        initListeners: function() {
            document.getElementById('junkRemovalVolume').addEventListener('change', calculateOverallCost);
            document.getElementById('junkRemovalType').addEventListener('change', calculateOverallCost);
            document.getElementById('junkRemovalAccessibility').addEventListener('change', calculateOverallCost);
            setupAddonVisibility('junkRemovalMattressSurcharge', 'junkRemovalMattressInputs', 'junkRemovalMattressesValue');
            setupAddonVisibility('junkRemovalTireSurcharge', 'junkRemovalTireInputs', 'junkRemovalTiresValue');
            setupAddonVisibility('junkRemovalHeavyItemSurcharge', 'junkRemovalHeavyItemInputs', 'junkRemovalHeavyItemsValue');
            setupAddonVisibility('junkRemovalDemolition', 'junkRemovalDemolitionInputs', 'junkRemovalDemolitionHours');
            document.getElementById('junkRemovalDemolitionHours').addEventListener('input', calculateOverallCost); // Direct input for hours
            document.getElementById('junkRemovalCleanUpAfter').addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            document.getElementById('junkRemovalMattressInputs').classList.toggle('hidden', !document.getElementById('junkRemovalMattressSurcharge').checked);
            document.getElementById('junkRemovalTireInputs').classList.toggle('hidden', !document.getElementById('junkRemovalTireSurcharge').checked);
            document.getElementById('junkRemovalHeavyItemInputs').classList.toggle('hidden', !document.getElementById('junkRemovalHeavyItemSurcharge').checked);
            document.getElementById('junkRemovalDemolitionInputs').classList.toggle('hidden', !document.getElementById('junkRemovalDemolition').checked);
        }
    },
    'irrigation': {
        state: { numZones: 4, estimatedHours: 1 },
        pricing: {
            serviceTypeRates: {
                'newInstallation': { min: 100, max: 250, perZoneMin: 50, perZoneMax: 100 }, // Base + per zone
                'repairTroubleshooting': { min: 80, max: 150 }, // Hourly applies here
                'seasonalMaintenance': { min: 75, max: 150 }, // Flat fee
                'systemAudit': { min: 150, max: 300 } // Flat fee
            },
            propertySizeMultipliers: { 'small': { min: 1.0, max: 1.0 }, 'medium': { min: 1.2, max: 1.4 }, 'large': { min: 1.5, max: 1.8 } },
            hourlyRate: { min: 60, max: 100 }, // For repair/audit
            addOns: { dripSystem: { min: 200, max: 500 }, rainSensor: { min: 100, max: 200 }, backflowTesting: { min: 75, max: 150 } },
            minimumJobFee: { min: 75, max: 150 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing;
            const serviceType = getElementValue('irrigationServiceType');
            state.numZones = getElementValue('irrigationNumZonesValue');
            state.estimatedHours = getElementValue('irrigationEstimatedHours');
            const propertySize = getElementValue('irrigationPropertySize');

            const sizeMultiplier = pricing.propertySizeMultipliers[propertySize];

            if (serviceType === 'newInstallation') {
                costMin += pricing.serviceTypeRates.newInstallation.min; costMax += pricing.serviceTypeRates.newInstallation.max;
                costMin += state.numZones * pricing.serviceTypeRates.newInstallation.perZoneMin;
                costMax += state.numZones * pricing.serviceTypeRates.newInstallation.perZoneMax;
                costMin *= sizeMultiplier.min; costMax *= sizeMultiplier.max; // Apply size multiplier to new install
            } else if (serviceType === 'repairTroubleshooting' || serviceType === 'systemAudit') {
                costMin += state.estimatedHours * pricing.hourlyRate.min; costMax += state.estimatedHours * pricing.hourlyRate.max;
                costMin *= sizeMultiplier.min; costMax *= sizeMultiplier.max; // Apply size multiplier to hourly
            } else if (serviceType === 'seasonalMaintenance') {
                costMin += pricing.serviceTypeRates.seasonalMaintenance.min; costMax += pricing.serviceTypeRates.seasonalMaintenance.max;
                costMin *= sizeMultiplier.min; costMax *= sizeMultiplier.max; // Apply size multiplier to flat fee
            }

            if (getElementValue('irrigationDripSystem')) { costMin += pricing.addOns.dripSystem.min; costMax += pricing.addOns.dripSystem.max; }
            if (getElementValue('irrigationRainSensor')) { costMin += pricing.addOns.rainSensor.min; costMax += pricing.addOns.rainSensor.max; }
            if (getElementValue('irrigationBackflowTesting')) { costMin += pricing.addOns.backflowTesting.min; costMax += pricing.addOns.backflowTesting.max; }

            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const irrigationServiceTypeSelect = document.getElementById('irrigationServiceType');
            irrigationServiceTypeSelect.addEventListener('change', this.initDisplay);
            document.getElementById('irrigationEstimatedHours').addEventListener('input', calculateOverallCost);
            document.getElementById('irrigationPropertySize').addEventListener('change', calculateOverallCost);
            document.getElementById('irrigationDripSystem').addEventListener('change', calculateOverallCost);
            document.getElementById('irrigationRainSensor').addEventListener('change', calculateOverallCost);
            document.getElementById('irrigationBackflowTesting').addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const serviceType = getElementValue('irrigationServiceType');
            const numZonesGroup = document.getElementById('irrigationNumZonesGroup');
            const estimatedHoursGroup = document.getElementById('irrigationEstimatedHoursGroup');

            if (serviceType === 'newInstallation') {
                numZonesGroup.classList.remove('hidden');
                estimatedHoursGroup.classList.add('hidden');
            } else if (serviceType === 'repairTroubleshooting' || serviceType === 'systemAudit') {
                numZonesGroup.classList.add('hidden');
                estimatedHoursGroup.classList.remove('hidden');
            } else { // Seasonal Maintenance
                numZonesGroup.classList.add('hidden');
                estimatedHoursGroup.classList.add('hidden');
            }
        }
    },
    'fence': {
        state: { linearFeet: 100, numGates: 1 },
        pricing: {
            materials: {
                'wood': { '4': { min: 15, max: 30 }, '5': { min: 20, max: 40 }, '6': { min: 25, max: 50 }, '8': { min: 35, max: 70 } },
                'vinyl': { '4': { min: 20, max: 40 }, '5': { min: 25, max: 50 }, '6': { min: 30, max: 60 }, '8': { min: 40, max: 80 } },
                'chainLink': { '4': { min: 10, max: 20 }, '5': { min: 12, max: 25 }, '6': { min: 15, max: 30 }, '8': { min: 18, max: 35 } },
                'aluminumSteel': { '4': { min: 25, max: 50 }, '5': { min: 30, max: 60 }, '6': { min: 35, max: 70 }, '8': { min: 45, max: 90 } }
            },
            repairCosts: { 'minor': { min: 100, max: 250 }, 'moderate': { min: 300, max: 600 }, 'extensive': { min: 700, max: 1500 } },
            stainingSealingPerLinearFt: { min: 3, max: 8 },
            removalPerLinearFt: { min: 5, max: 15 },
            gateInstallation: { min: 200, max: 400 },
            addOns: { oldFenceRemoval: { min: 50, max: 100 }, postCaps: { min: 10, max: 30 } }, // Per fence, per cap
            minimumJobFee: { min: 200, max: 500 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing;
            const serviceType = getElementValue('fenceServiceType');
            state.linearFeet = getElementValue('fenceLinearFeet');
            const material = getElementValue('fenceMaterial');
            const height = getElementValue('fenceHeight');
            const repairSeverity = getElementValue('fenceRepairSeverity');
            state.numGates = getElementValue('fenceNumGatesValue');

            if (serviceType === 'newInstallation') {
                const materialCost = pricing.materials[material][height];
                if (materialCost) { costMin += state.linearFeet * materialCost.min; costMax += state.linearFeet * materialCost.max; }
            } else if (serviceType === 'repair') {
                const repairCost = pricing.repairCosts[repairSeverity];
                if (repairCost) { costMin += repairCost.min; costMax += repairCost.max; }
            } else if (serviceType === 'stainingSealing') {
                costMin += state.linearFeet * pricing.stainingSealingPerLinearFt.min;
                costMax += state.linearFeet * pricing.stainingSealingPerLinearFt.max;
            } else if (serviceType === 'removal') {
                costMin += state.linearFeet * pricing.removalPerLinearFt.min;
                costMax += state.linearFeet * pricing.removalPerLinearFt.max;
            }

            if (getElementValue('fenceGateInstallation')) {
                costMin += state.numGates * pricing.gateInstallation.min;
                costMax += state.numGates * pricing.gateInstallation.max;
            }
            if (getElementValue('fenceOldFenceRemoval') && serviceType !== 'removal') { costMin += pricing.addOns.oldFenceRemoval.min; costMax += pricing.addOns.oldFenceRemoval.max; }
            if (getElementValue('fencePostCaps')) { costMin += state.linearFeet * pricing.addOns.postCaps.min; costMax += state.linearFeet * pricing.addOns.postCaps.max; }
            
            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const serviceTypeSelect = document.getElementById('fenceServiceType');
            serviceTypeSelect.addEventListener('change', this.initDisplay);
            document.getElementById('fenceLinearFeet').addEventListener('input', calculateOverallCost);
            document.getElementById('fenceMaterial').addEventListener('change', calculateOverallCost);
            document.getElementById('fenceHeight').addEventListener('change', calculateOverallCost);
            document.getElementById('fenceRepairSeverity').addEventListener('change', calculateOverallCost);
            document.getElementById('fenceGateInstallation').addEventListener('change', this.initDisplay); // calls initDisplay for gate inputs
            document.getElementById('fenceOldFenceRemoval').addEventListener('change', calculateOverallCost);
            document.getElementById('fencePostCaps').addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const serviceType = getElementValue('fenceServiceType');
            const linearFeetGroup = document.getElementById('fenceLinearFeetGroup');
            const materialGroup = document.getElementById('fenceMaterialGroup');
            const heightSelect = document.getElementById('fenceHeight');
            const repairSeverityGroup = document.getElementById('fenceRepairSeverityGroup');
            const gateInstallationInputs = document.getElementById('fenceGateInstallationInputs');

            if (serviceType === 'repair') {
                repairSeverityGroup.classList.remove('hidden');
                linearFeetGroup.classList.add('hidden');
                materialGroup.classList.add('hidden');
                heightSelect.closest('.rg-form-group').classList.add('hidden');
            } else {
                repairSeverityGroup.classList.add('hidden');
                linearFeetGroup.classList.remove('hidden');
                materialGroup.classList.remove('hidden');
                heightSelect.closest('.rg-form-group').classList.remove('hidden');
            }
            gateInstallationInputs.classList.toggle('hidden', !document.getElementById('fenceGateInstallation').checked);
        }
    },
    'janitorial': {
        state: { areaSqFt: 2000, numRestrooms: 1 },
        pricing: {
            baseRatesPerSqFtPerMonth: { // For monthly service, scaled by frequency
                'office': { min: 0.10, max: 0.20 }, 'retail': { min: 0.15, max: 0.25 }, 'medical': { min: 0.20, max: 0.35 }, 'restaurant': { min: 0.25, max: 0.40 }, 'industrial': { min: 0.10, max: 0.25 }, 'other': { min: 0.15, max: 0.30 }
            },
            frequencyMultipliers: {
                'daily': { min: 4.0, max: 5.0 }, // Multiplier on weekly cost (daily is ~20-22 visits/month)
                'weekly': { min: 1.0, max: 1.0 }, // Base frequency
                'biWeekly': { min: 0.6, max: 0.7 }, // Percentage of weekly cost
                'monthly': { min: 0.3, max: 0.4 }, // Percentage of weekly cost
                'oneTime': { min: 0.5, max: 0.8 } // Multiplier on monthly flat cost for deep clean
            },
            perRestroomCost: { min: 20, max: 50 }, // Per restroom per service
            addOns: { floorCare: { min: 0.05, max: 0.15 }, windowCleaning: { min: 0.03, max: 0.08 }, trashRemoval: { min: 30, max: 80 }, suppliesProvided: { min: 0.10, max: 0.20 } }, // Cost per sq.ft or flat
            minimumJobFee: { min: 200, max: 500 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing;
            const propertyType = getElementValue('janitorialPropertyType');
            state.areaSqFt = getElementValue('janitorialAreaSqFt');
            const serviceFrequency = getElementValue('janitorialServiceFrequency');
            state.numRestrooms = getElementValue('janitorialNumRestroomsValue');

            let baseRateMin = pricing.baseRatesPerSqFtPerMonth[propertyType].min * state.areaSqFt;
            let baseRateMax = pricing.baseRatesPerSqFtPerMonth[propertyType].max * state.areaSqFt;

            if (serviceFrequency === 'oneTime') {
                costMin += baseRateMin * pricing.frequencyMultipliers.oneTime.min;
                costMax += baseRateMax * pricing.frequencyMultipliers.oneTime.max;
            } else {
                costMin += baseRateMin * pricing.frequencyMultipliers[serviceFrequency].min;
                costMax += baseRateMax * pricing.frequencyMultipliers[serviceFrequency].max;
            }

            // Add restroom cost
            costMin += state.numRestrooms * pricing.perRestroomCost.min * (serviceFrequency === 'oneTime' ? 1 : (serviceFrequency === 'daily' ? 20 : (serviceFrequency === 'weekly' ? 4 : (serviceFrequency === 'biWeekly' ? 2 : 1)))); // Adjust per restroom cost by frequency if applicable
            costMax += state.numRestrooms * pricing.perRestroomCost.max * (serviceFrequency === 'oneTime' ? 1 : (serviceFrequency === 'daily' ? 20 : (serviceFrequency === 'weekly' ? 4 : (serviceFrequency === 'biWeekly' ? 2 : 1))));

            // Add-ons
            if (getElementValue('janitorialFloorCare')) { costMin += state.areaSqFt * pricing.addOns.floorCare.min; costMax += state.areaSqFt * pricing.addOns.floorCare.max; }
            if (getElementValue('janitorialWindowCleaning')) { costMin += state.areaSqFt * pricing.addOns.windowCleaning.min; costMax += state.areaSqFt * pricing.addOns.windowCleaning.max; }
            if (getElementValue('janitorialTrashRemoval')) { costMin += pricing.addOns.trashRemoval.min; costMax += pricing.addOns.trashRemoval.max; }
            if (getElementValue('janitorialSuppliesProvided')) { costMin += state.areaSqFt * pricing.addOns.suppliesProvided.min; costMax += state.areaSqFt * pricing.addOns.suppliesProvided.max; }

            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            document.getElementById('janitorialPropertyType').addEventListener('change', calculateOverallCost);
            document.getElementById('janitorialAreaSqFt').addEventListener('input', calculateOverallCost);
            document.getElementById('janitorialServiceFrequency').addEventListener('change', calculateOverallCost);
            document.getElementById('janitorialFloorCare').addEventListener('change', calculateOverallCost);
            document.getElementById('janitorialWindowCleaning').addEventListener('change', calculateOverallCost);
            document.getElementById('janitorialTrashRemoval').addEventListener('change', calculateOverallCost);
            document.getElementById('janitorialSuppliesProvided').addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() { /* No specific dynamic visibility beyond default */ }
    },
    'flooring': {
        state: { areaSqFt: 200, numStairs: 1 },
        pricing: {
            materials: { // Cost per sq.ft for installation
                'hardwood': { min: 8, max: 20, refinishMin: 3, refinishMax: 6 },
                'laminate': { min: 4, max: 8 },
                'vinyl': { min: 3, max: 7 },
                'tile': { min: 7, max: 18 },
                'carpet': { min: 2, max: 5 }
            },
            serviceTypeAdjustments: {
                'installation': { min: 1.0, max: 1.0 },
                'repair': { min: 1.5, max: 3.0 }, // Hourly or per minor repair, complex to estimate per sq.ft
                'refinishing': { min: 1.0, max: 1.0 }, // Specific refinishing rates per sq.ft
                'removalDisposal': { min: 0.5, max: 1.5 } // Per sq.ft
            },
            subfloorConditionMultipliers: {
                'good': { min: 1.0, max: 1.0 },
                'minorPrep': { min: 1.1, max: 1.3 },
                'majorPrep': { min: 1.4, max: 1.8 }
            },
            addOns: { baseboard: { min: 5, max: 15 }, furnitureMoving: { min: 100, max: 300 }, stairInstallation: { min: 40, max: 100 } }, // Baseboard per linear foot (using sqft as proxy), Furniture moving flat, Stairs per stair
            minimumJobFee: { min: 250, max: 500 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing;
            const serviceType = getElementValue('flooringServiceType');
            const materialType = getElementValue('flooringMaterialType');
            state.areaSqFt = getElementValue('flooringAreaSqFt');
            const subfloorCondition = getElementValue('flooringSubfloorCondition');
            state.numStairs = getElementValue('flooringNumStairsValue');

            let baseMin = 0; let baseMax = 0;
            if (serviceType === 'installation') {
                baseMin = state.areaSqFt * pricing.materials[materialType].min;
                baseMax = state.areaSqFt * pricing.materials[materialType].max;
            } else if (serviceType === 'refinishing' && materialType === 'hardwood') {
                baseMin = state.areaSqFt * pricing.materials.hardwood.refinishMin;
                baseMax = state.areaSqFt * pricing.materials.hardwood.refinishMax;
            } else if (serviceType === 'removalDisposal') {
                baseMin = state.areaSqFt * pricing.serviceTypeAdjustments.removalDisposal.min;
                baseMax = state.areaSqFt * pricing.serviceTypeAdjustments.removalDisposal.max;
            } else if (serviceType === 'repair') { // Repair is tricky, assuming a small flat fee or hourly component
                 baseMin = 150; baseMax = 400; // Placeholder for repair base
            }

            costMin += baseMin; costMax += baseMax;

            // Apply subfloor condition multiplier for installation/refinishing
            if (serviceType === 'installation' || serviceType === 'refinishing') {
                costMin *= pricing.subfloorConditionMultipliers[subfloorCondition].min;
                costMax *= pricing.subfloorConditionMultipliers[subfloorCondition].max;
            }

            if (getElementValue('flooringBaseboardInstallation')) { costMin += state.areaSqFt * 0.5 * pricing.addOns.baseboard.min; costMax += state.areaSqFt * 0.5 * pricing.addOns.baseboard.max; } // Approx linear ft from sqft
            if (getElementValue('flooringFurnitureMoving')) { costMin += pricing.addOns.furnitureMoving.min; costMax += pricing.addOns.furnitureMoving.max; }
            if (getElementValue('flooringStairInstallation')) { costMin += state.numStairs * pricing.addOns.stairInstallation.min; costMax += state.numStairs * pricing.addOns.stairInstallation.max; }
            
            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const flooringServiceTypeSelect = document.getElementById('flooringServiceType');
            flooringServiceTypeSelect.addEventListener('change', this.initDisplay);
            document.getElementById('flooringMaterialType').addEventListener('change', calculateOverallCost);
            document.getElementById('flooringAreaSqFt').addEventListener('input', calculateOverallCost);
            document.getElementById('flooringSubfloorCondition').addEventListener('change', calculateOverallCost);
            document.getElementById('flooringBaseboardInstallation').addEventListener('change', calculateOverallCost);
            document.getElementById('flooringFurnitureMoving').addEventListener('change', calculateOverallCost);
            setupAddonVisibility('flooringStairInstallation', 'flooringStairInstallationInputs', 'flooringNumStairsValue');
        },
        initDisplay: function() {
            const serviceType = getElementValue('flooringServiceType');
            const areaTypeGroup = document.getElementById('flooringAreaSqFtGroup');
            const numRoomsGroup = document.getElementById('flooringNumRoomsGroup'); // Not used, but common toggle pair
            if (serviceType === 'perRoom') { // Placeholder if rooms-based was added
                areaTypeGroup.classList.add('hidden');
                numRoomsGroup.classList.remove('hidden');
            } else {
                areaTypeGroup.classList.remove('hidden');
                if (numRoomsGroup) numRoomsGroup.classList.add('hidden');
            }

            document.getElementById('flooringStairInstallationInputs').classList.toggle('hidden', !document.getElementById('flooringStairInstallation').checked);
        }
    },
    'dog-walking': {
        state: { numDogs: 1, duration: 30 }, // Default 30 min walk
        pricing: {
            baseRatesPerWalk: {
                '15': { min: 15, max: 25 }, '30': { min: 20, max: 35 }, '45': { min: 25, max: 45 }, '60': { min: 30, max: 55 }
            },
            frequencyDiscounts: { // Multiplier on per-walk rate for packages
                'oneTime': { min: 1.0, max: 1.0 },
                'daily': { min: 0.8, max: 0.9, numWalks: 20 }, // Daily (Mon-Fri) ~20 walks/month
                'weekly': { min: 0.9, max: 1.0, numWalks: 3 }, // e.g. 3x/week
                'monthly': { min: 0.75, max: 0.85, numWalks: 15 } // Flat monthly package for ~15 walks
            },
            perAdditionalDog: { min: 5, max: 10 }, // Per walk per additional dog
            addOns: { weekendHoliday: { min: 5, max: 15 }, additionalServices: { min: 10, max: 25 }, puppySeniorSurcharge: { min: 5, max: 10 } },
            minimumCharge: { min: 20, max: 30 } // For very short or single walks
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing;
            state.numDogs = getElementValue('dogWalkingNumDogsValue');
            state.duration = getElementValue('dogWalkingDuration');
            const frequency = getElementValue('dogWalkingFrequency');

            let baseWalkMin = pricing.baseRatesPerWalk[state.duration].min;
            let baseWalkMax = pricing.baseRatesPerWalk[state.duration].max;

            // Apply additional dog cost per walk
            if (state.numDogs > 1) {
                baseWalkMin += (state.numDogs - 1) * pricing.perAdditionalDog.min;
                baseWalkMax += (state.numDogs - 1) * pricing.perAdditionalDog.max;
            }

            // Apply frequency adjustments (package pricing)
            if (frequency === 'oneTime') {
                costMin += baseWalkMin; costMax += baseWalkMax;
            } else {
                const freqAdj = pricing.frequencyDiscounts[frequency];
                // For daily/weekly/monthly, calculate total for package
                costMin += (baseWalkMin * freqAdj.numWalks) * freqAdj.min;
                costMax += (baseWalkMax * freqAdj.numWalks) * freqAdj.max;
            }
            
            if (getElementValue('dogWalkingWeekendHoliday')) { costMin += pricing.addOns.weekendHoliday.min; costMax += pricing.addOns.weekendHoliday.max; }
            if (getElementValue('dogWalkingAdditionalServices')) { costMin += pricing.addOns.additionalServices.min; costMax += pricing.addOns.additionalServices.max; }
            if (getElementValue('dogWalkingPuppySeniorCare')) { costMin += pricing.addOns.puppySeniorSurcharge.min; costMax += pricing.addOns.puppySeniorSurcharge.max; }

            costMin = Math.max(costMin, pricing.minimumCharge.min); costMax = Math.max(costMax, pricing.minimumCharge.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            document.getElementById('dogWalkingDuration').addEventListener('change', calculateOverallCost);
            document.getElementById('dogWalkingFrequency').addEventListener('change', calculateOverallCost);
            document.getElementById('dogWalkingWeekendHoliday').addEventListener('change', calculateOverallCost);
            document.getElementById('dogWalkingAdditionalServices').addEventListener('change', calculateOverallCost);
            document.getElementById('dogWalkingPuppySeniorCare').addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() { /* No specific dynamic visibility beyond default */ }
    },
    'appliance-repair': {
        state: {},
        pricing: {
            diagnosticFee: { min: 75, max: 150 }, // Base diagnostic fee
            applianceTypeBase: {
                'refrigerator': { min: 150, max: 400 }, 'washer': { min: 100, max: 300 }, 'dryer': { min: 100, max: 300 },
                'dishwasher': { min: 120, max: 350 }, 'ovenStove': { min: 150, max: 450 }, 'microwave': { min: 80, max: 200 },
                'other': { min: 100, max: 300 }
            },
            issueSeverityMultipliers: { 'minor': { min: 0.8, max: 1.0 }, 'moderate': { min: 1.0, max: 1.5 }, 'major': { min: 1.5, max: 2.5 } },
            urgencySurcharges: { 'standard': { min: 0, max: 0 }, 'urgent': { min: 50, max: 100 }, 'emergency': { min: 100, max: 250 } },
            addOns: { partsNeeded: { min: 50, max: 300 } }, // Placeholder for average part cost
            minimumJobFee: { min: 120, max: 200 } // Minimum repair charge if diagnostic waived
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const pricing = this.pricing;
            const applianceType = getElementValue('applianceType');
            const issueSeverity = getElementValue('issueSeverity');
            const repairUrgency = getElementValue('repairUrgency');
            const partsNeeded = getElementValue('partsNeeded');
            const diagnosticFeeIncluded = getElementValue('diagnosticFee');

            // Start with diagnostic fee if selected
            if (diagnosticFeeIncluded) {
                costMin += pricing.diagnosticFee.min; costMax += pricing.diagnosticFee.max;
            }

            // Base repair cost by appliance type
            let baseRepairMin = pricing.applianceTypeBase[applianceType].min;
            let baseRepairMax = pricing.applianceTypeBase[applianceType].max;

            // Apply severity multiplier
            baseRepairMin *= pricing.issueSeverityMultipliers[issueSeverity].min;
            baseRepairMax *= pricing.issueSeverityMultipliers[issueSeverity].max;

            costMin += baseRepairMin; costMax += baseRepairMax;

            // Apply urgency surcharge
            costMin += pricing.urgencySurcharges[repairUrgency].min;
            costMax += pricing.urgencySurcharges[repairUrgency].max;

            // Add placeholder for parts if checked (actual parts would vary wildly)
            if (partsNeeded) { costMin += pricing.addOns.partsNeeded.min; costMax += pricing.addOns.partsNeeded.max; }
            
            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            document.getElementById('applianceType').addEventListener('change', calculateOverallCost);
            document.getElementById('issueSeverity').addEventListener('change', calculateOverallCost);
            document.getElementById('repairUrgency').addEventListener('change', calculateOverallCost);
            document.getElementById('partsNeeded').addEventListener('change', calculateOverallCost);
            document.getElementById('diagnosticFee').addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() { /* No specific dynamic visibility beyond default */ }
    },
    'chimney-sweep': {
        state: { numFlues: 1, repairHours: 1 },
        pricing: {
            serviceTypeRates: {
                'inspection': { min: 80, max: 150 }, 'sweep': { min: 150, max: 300 }, 'inspectionSweep': { min: 200, max: 400 },
                'level2Inspection': { min: 250, max: 500 }, 'repair': { min: 0, max: 0 } // Hourly
            },
            perFlueMultiplier: { min: 50, max: 100 }, // Added per flue cost for sweep/inspect
            chimneyTypeAdjustments: { 'standard': { min: 1.0, max: 1.0 }, 'prefab': { min: 0.9, max: 1.1 }, 'woodStove': { min: 1.1, max: 1.3 } },
            hourlyRate: { min: 75, max: 120 }, // For repair
            addOns: { creosoteRemoval: { min: 100, max: 250 }, capInstallation: { min: 150, max: 300 }, waterproofing: { min: 200, max: 500 } },
            minimumJobFee: { min: 100, max: 200 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing;
            const serviceType = getElementValue('chimneyServiceType');
            const chimneyType = getElementValue('chimneyType');
            state.numFlues = getElementValue('chimneyFluesValue');
            state.repairHours = getElementValue('chimneyRepairHours');

            let baseMin = 0; let baseMax = 0;

            if (serviceType === 'repair') {
                baseMin = state.repairHours * pricing.hourlyRate.min; baseMax = state.repairHours * pricing.hourlyRate.max;
            } else {
                baseMin = pricing.serviceTypeRates[serviceType].min; baseMax = pricing.serviceTypeRates[serviceType].max;
                // Add per flue cost (for multiple flues)
                if (state.numFlues > 1) {
                    baseMin += (state.numFlues - 1) * pricing.perFlueMultiplier.min;
                    baseMax += (state.numFlues - 1) * pricing.perFlueMultiplier.max;
                }
                // Apply chimney type adjustment
                baseMin *= pricing.chimneyTypeAdjustments[chimneyType].min;
                baseMax *= pricing.chimneyTypeAdjustments[chimneyType].max;
            }
            costMin += baseMin; costMax += baseMax;
            
            if (getElementValue('chimneyCreosoteRemoval')) { costMin += pricing.addOns.creosoteRemoval.min; costMax += pricing.addOns.creosoteRemoval.max; }
            if (getElementValue('chimneyCapInstallation')) { costMin += pricing.addOns.capInstallation.min; costMax += pricing.addOns.capInstallation.max; }
            if (getElementValue('chimneyWaterproofing')) { costMin += pricing.addOns.waterproofing.min; costMax += pricing.addOns.waterproofing.max; }

            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const chimneyServiceTypeSelect = document.getElementById('chimneyServiceType');
            chimneyServiceTypeSelect.addEventListener('change', this.initDisplay);
            document.getElementById('chimneyType').addEventListener('change', calculateOverallCost);
            document.getElementById('chimneyRepairHours').addEventListener('input', calculateOverallCost);
            document.getElementById('chimneyCreosoteRemoval').addEventListener('change', calculateOverallCost);
            document.getElementById('chimneyCapInstallation').addEventListener('change', calculateOverallCost);
            document.getElementById('chimneyWaterproofing').addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const serviceType = getElementValue('chimneyServiceType');
            const repairHoursGroup = document.getElementById('chimneyRepairHoursGroup');
            if (serviceType === 'repair') { repairHoursGroup.classList.remove('hidden'); }
            else { repairHoursGroup.classList.add('hidden'); }
        }
    },
    'carpet-cleaning': {
        state: { numRooms: 1, areaSqFt: 200, numStairs: 1 },
        pricing: {
            baseRatesPerRoom: { 'steam': { min: 50, max: 80 }, 'dry': { min: 40, max: 70 }, 'shampoo': { min: 30, max: 60 } },
            baseRatesPerSqFt: { 'steam': { min: 0.25, max: 0.50 }, 'dry': { min: 0.20, max: 0.45 }, 'shampoo': { min: 0.15, max: 0.35 } },
            conditionMultipliers: { 'light': { min: 1.0, max: 1.0 }, 'medium': { min: 1.2, max: 1.4 }, 'heavy': { min: 1.5, max: 2.0 } },
            addOns: { spotTreatment: { min: 25, max: 75 }, deodorizing: { min: 20, max: 50 }, protector: { min: 0.10, max: 0.20 }, stairCleaning: { min: 5, max: 15 } }, // Protector per sq.ft
            minimumJobFee: { min: 100, max: 200 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing;
            const method = getElementValue('carpetCleaningMethod');
            const areaType = getElementValue('carpetCleaningAreaType');
            state.numRooms = getElementValue('carpetCleaningNumRoomsValue');
            state.areaSqFt = getElementValue('carpetCleaningAreaSqFt');
            const condition = getElementValue('carpetCondition');
            state.numStairs = getElementValue('carpetCleaningNumStairsValue');

            let baseMin = 0; let baseMax = 0;
            if (areaType === 'perRoom') { baseMin = state.numRooms * pricing.baseRatesPerRoom[method].min; baseMax = state.numRooms * pricing.baseRatesPerRoom[method].max; }
            else { baseMin = state.areaSqFt * pricing.baseRatesPerSqFt[method].min; baseMax = state.areaSqFt * pricing.baseRatesPerSqFt[method].max; }
            
            baseMin *= pricing.conditionMultipliers[condition].min; baseMax *= pricing.conditionMultipliers[condition].max;
            costMin += baseMin; costMax += baseMax;
            
            if (getElementValue('carpetSpotTreatment')) { costMin += pricing.addOns.spotTreatment.min; costMax += pricing.addOns.spotTreatment.max; }
            if (getElementValue('carpetDeodorizing')) { costMin += pricing.addOns.deodorizing.min; costMax += pricing.addOns.deodorizing.max; }
            if (getElementValue('carpetProtector')) { costMin += state.areaSqFt * pricing.addOns.protector.min; costMax += state.areaSqFt * pricing.addOns.protector.max; }
            if (getElementValue('carpetStairCleaning')) { costMin += state.numStairs * pricing.addOns.stairCleaning.min; costMax += state.numStairs * pricing.addOns.stairCleaning.max; }
            
            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const carpetCleaningAreaTypeSelect = document.getElementById('carpetCleaningAreaType');
            carpetCleaningAreaTypeSelect.addEventListener('change', this.initDisplay);
            document.getElementById('carpetCleaningMethod').addEventListener('change', calculateOverallCost);
            document.getElementById('carpetCleaningAreaSqFt').addEventListener('input', calculateOverallCost);
            document.getElementById('carpetCondition').addEventListener('change', calculateOverallCost);
            document.getElementById('carpetSpotTreatment').addEventListener('change', calculateOverallCost);
            document.getElementById('carpetDeodorizing').addEventListener('change', calculateOverallCost);
            document.getElementById('carpetProtector').addEventListener('change', calculateOverallCost);
            setupAddonVisibility('carpetStairCleaning', 'carpetStairCleaningInputs', 'carpetCleaningNumStairsValue');
        },
        initDisplay: function() {
            const areaType = getElementValue('carpetCleaningAreaType');
            const numRoomsGroup = document.getElementById('carpetCleaningNumRoomsGroup');
            const areaSqFtGroup = document.getElementById('carpetCleaningAreaSqFtGroup');
            if (areaType === 'perRoom') { numRoomsGroup.classList.remove('hidden'); areaSqFtGroup.classList.add('hidden'); }
            else { numRoomsGroup.classList.add('hidden'); areaSqFtGroup.classList.remove('hidden'); }

            document.getElementById('carpetStairCleaningInputs').classList.toggle('hidden', !document.getElementById('carpetStairCleaning').checked);
        }
    },
    'carpentry': {
        state: { estimatedHours: 4 },
        pricing: {
            hourlyRate: { min: 60, max: 120 },
            projectTypeBaseHours: {
                'minorRepair': { min: 2, max: 6 }, 'framing': { min: 8, max: 40 }, 'cabinetryBuiltIns': { min: 12, max: 60 },
                'deckFenceBuild': { min: 16, max: 80 }, 'customWoodwork': { min: 10, max: 50 }, 'other': { min: 0, max: 0 }
            },
            complexityMultipliers: { 'low': { min: 1.0, max: 1.0 }, 'medium': { min: 1.2, max: 1.5 }, 'high': { min: 1.6, max: 2.0 } },
            materialQualityMultipliers: { 'standard': { min: 1.0, max: 1.0 }, 'premium': { min: 1.2, max: 1.5 }, 'reclaimed': { min: 1.5, max: 2.0 } }, // For hourly material markup
            addOns: { demolitionRemoval: { min: 100, max: 300 }, finishingStaining: { min: 50, max: 200 }, permitAssistance: { min: 75, max: 150 } },
            minimumJobFee: { min: 150, max: 300 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing;
            const projectType = getElementValue('carpentryProjectType');
            state.estimatedHours = getElementValue('carpentryEstimatedHours');
            const complexity = getElementValue('carpentryComplexity');
            const materialQuality = getElementValue('carpentryMaterialQuality');

            let baseMinHours = state.estimatedHours; let baseMaxHours = state.estimatedHours;

            if (projectType !== 'other') {
                baseMinHours = pricing.projectTypeBaseHours[projectType].min;
                baseMaxHours = pricing.projectTypeBaseHours[projectType].max;
            }

            costMin += baseMinHours * pricing.hourlyRate.min;
            costMax += baseMaxHours * pricing.hourlyRate.max;

            costMin *= pricing.complexityMultipliers[complexity].min; costMax *= pricing.complexityMultipliers[complexity].max;
            costMin *= pricing.materialQualityMultipliers[materialQuality].min; costMax *= pricing.materialQualityMultipliers[materialQuality].max;

            if (getElementValue('carpentryDemolitionRemoval')) { costMin += pricing.addOns.demolitionRemoval.min; costMax += pricing.addOns.demolitionRemoval.max; }
            if (getElementValue('carpentryFinishingStaining')) { costMin += pricing.addOns.finishingStaining.min; costMax += pricing.addOns.finishingStaining.max; }
            if (getElementValue('carpentryPermitAssistance')) { costMin += pricing.addOns.permitAssistance.min; costMax += pricing.addOns.permitAssistance.max; }
            
            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const carpentryProjectTypeSelect = document.getElementById('carpentryProjectType');
            carpentryProjectTypeSelect.addEventListener('change', this.initDisplay);
            document.getElementById('carpentryEstimatedHours').addEventListener('input', calculateOverallCost);
            document.getElementById('carpentryComplexity').addEventListener('change', calculateOverallCost);
            document.getElementById('carpentryMaterialQuality').addEventListener('change', calculateOverallCost);
            document.getElementById('carpentryDemolitionRemoval').addEventListener('change', calculateOverallCost);
            document.getElementById('carpentryFinishingStaining').addEventListener('change', calculateOverallCost);
            document.getElementById('carpentryPermitAssistance').addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const projectType = getElementValue('carpentryProjectType');
            const estimatedHoursGroup = document.getElementById('carpentryEstimatedHoursGroup');
            if (projectType === 'other') { estimatedHoursGroup.classList.remove('hidden'); }
            else { estimatedHoursGroup.classList.add('hidden'); }
        }
    },
    'garage-services': {
        state: {},
        pricing: {
            serviceTypeRates: {
                'doorRepair': { min: 150, max: 400 }, 'openerRepair': { min: 100, max: 350 },
                'newDoorInstall': { min: 500, max: 1500 }, // Base cost, material adds on
                'newOpenerInstall': { min: 250, max: 600 },
                'maintenance': { min: 80, max: 150 }
            },
            doorTypeAdjustments: { 'single': { min: 1.0, max: 1.0 }, 'double': { min: 1.5, max: 2.0 }, 'custom': { min: 2.0, max: 3.0 } },
            materialMultipliers: { // For new door install
                'steel': { min: 1.0, max: 1.0 }, 'wood': { min: 1.5, max: 2.5 }, 'aluminum': { min: 1.2, max: 1.8 }, 'fiberglass': { min: 1.1, max: 1.5 }
            },
            repairSeverityMultipliers: { 'minor': { min: 0.8, max: 1.0 }, 'moderate': { min: 1.2, max: 1.5 }, 'major': { min: 1.5, max: 2.0 } },
            addOns: { oldDoorRemoval: { min: 100, max: 250 }, keypadRemote: { min: 50, max: 100 }, smartOpener: { min: 75, max: 200 } },
            minimumJobFee: { min: 100, max: 200 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const pricing = this.pricing;
            const serviceType = getElementValue('garageServiceType');
            const doorType = getElementValue('garageDoorType');
            const materialType = getElementValue('garageMaterialType');
            const repairSeverity = getElementValue('garageRepairSeverity');

            let baseMin = 0; let baseMax = 0;

            if (serviceType === 'doorRepair' || serviceType === 'openerRepair') {
                baseMin = pricing.serviceTypeRates[serviceType].min; baseMax = pricing.serviceTypeRates[serviceType].max;
                baseMin *= pricing.repairSeverityMultipliers[repairSeverity].min; baseMax *= pricing.repairSeverityMultipliers[repairSeverity].max;
            } else if (serviceType === 'newDoorInstall') {
                baseMin = pricing.serviceTypeRates.newDoorInstall.min; baseMax = pricing.serviceTypeRates.newDoorInstall.max;
                baseMin *= pricing.doorTypeAdjustments[doorType].min; baseMax *= pricing.doorTypeAdjustments[doorType].max;
                baseMin *= pricing.materialMultipliers[materialType].min; baseMax *= pricing.materialMultipliers[materialType].max;
            } else { // newOpenerInstall, maintenance
                baseMin = pricing.serviceTypeRates[serviceType].min; baseMax = pricing.serviceTypeRates[serviceType].max;
            }
            costMin += baseMin; costMax += baseMax;

            if (getElementValue('garageOldDoorRemoval')) { costMin += pricing.addOns.oldDoorRemoval.min; costMax += pricing.addOns.oldDoorRemoval.max; }
            if (getElementValue('garageKeypadRemote')) { costMin += pricing.addOns.keypadRemote.min; costMax += pricing.addOns.keypadRemote.max; }
            if (getElementValue('garageSmartOpener')) { costMin += pricing.addOns.smartOpener.min; costMax += pricing.addOns.smartOpener.max; }

            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const garageServiceTypeSelect = document.getElementById('garageServiceType');
            garageServiceTypeSelect.addEventListener('change', this.initDisplay);
            document.getElementById('garageDoorType').addEventListener('change', calculateOverallCost);
            document.getElementById('garageMaterialType').addEventListener('change', calculateOverallCost);
            document.getElementById('garageRepairSeverity').addEventListener('change', calculateOverallCost);
            document.getElementById('garageOldDoorRemoval').addEventListener('change', calculateOverallCost);
            document.getElementById('garageKeypadRemote').addEventListener('change', calculateOverallCost);
            document.getElementById('garageSmartOpener').addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const serviceType = getElementValue('garageServiceType');
            const doorTypeSelect = document.getElementById('garageDoorType');
            const materialTypeSelect = document.getElementById('garageMaterialType');
            const repairSeverityGroup = document.getElementById('garageRepairSeverityGroup');

            // Toggle repair severity based on service type
            if (serviceType === 'doorRepair' || serviceType === 'openerRepair') {
                repairSeverityGroup.classList.remove('hidden');
            } else {
                repairSeverityGroup.classList.add('hidden');
            }

            // Toggle door type and material based on service type
            if (serviceType === 'newDoorInstall') {
                doorTypeSelect.closest('.rg-form-group').classList.remove('hidden');
                materialTypeSelect.closest('.rg-form-group').classList.remove('hidden');
            } else {
                doorTypeSelect.closest('.rg-form-group').classList.add('hidden');
                materialTypeSelect.closest('.rg-form-group').classList.add('hidden');
            }
        }
    },
    'professional': {
        state: { estimatedHours: 4 },
        pricing: {
            hourlyRateBase: { min: 75, max: 150 }, // General hourly rate
            serviceTypeAdjustments: {
                'homeOrganizing': { min: 1.0, max: 1.2 }, 'designConsultation': { min: 1.2, max: 1.5 },
                'staging': { min: 1.3, max: 1.6 }, 'personalAssistant': { min: 0.8, max: 1.0 },
                'generalConsulting': { min: 1.0, max: 1.2 }
            },
            expertiseLevelMultipliers: { 'standard': { min: 1.0, max: 1.0 }, 'specialist': { min: 1.3, max: 1.6 }, 'premium': { min: 1.7, max: 2.2 } },
            addOns: { travelFee: { min: 50, max: 200 }, materialSourcing: { min: 0.10, max: 0.20 }, followUp: { min: 75, max: 150 } }, // Material sourcing as % of cost or flat
            minimumJobFee: { min: 200, max: 400 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing;
            const serviceType = getElementValue('professionalServiceType');
            state.estimatedHours = getElementValue('professionalEstimatedHours');
            const expertiseLevel = getElementValue('professionalExpertiseLevel');

            let baseMin = state.estimatedHours * pricing.hourlyRateBase.min;
            let baseMax = state.estimatedHours * pricing.hourlyRateBase.max;

            baseMin *= pricing.serviceTypeAdjustments[serviceType].min;
            baseMax *= pricing.serviceTypeAdjustments[serviceType].max;
            baseMin *= pricing.expertiseLevelMultipliers[expertiseLevel].min;
            baseMax *= pricing.expertiseLevelMultipliers[expertiseLevel].max;

            costMin += baseMin; costMax += baseMax;

            if (getElementValue('professionalTravelFee')) { costMin += pricing.addOns.travelFee.min; costMax += pricing.addOns.travelFee.max; }
            if (getElementValue('professionalMaterialSourcing')) { costMin += pricing.addOns.materialSourcing.min * costMin; costMax += pricing.addOns.materialSourcing.max * costMax; }
            if (getElementValue('professionalFollowUp')) { costMin += pricing.addOns.followUp.min; costMax += pricing.addOns.followUp.max; }

            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            document.getElementById('professionalServiceType').addEventListener('change', calculateOverallCost);
            document.getElementById('professionalEstimatedHours').addEventListener('input', calculateOverallCost);
            document.getElementById('professionalExpertiseLevel').addEventListener('change', calculateOverallCost);
            document.getElementById('professionalTravelFee').addEventListener('change', calculateOverallCost);
            document.getElementById('professionalMaterialSourcing').addEventListener('change', calculateOverallCost);
            document.getElementById('professionalFollowUp').addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() { /* No specific dynamic visibility beyond default */ }
    },
    'tree-services': {
        state: { numTreesStumps: 1 },
        pricing: {
            serviceTypeRates: {
                'trimmingPruning': { min: 200, max: 600 },
                'removalSmall': { min: 250, max: 500 }, 'removalMedium': { min: 500, max: 1000 }, 'removalLarge': { min: 1000, max: 2500 },
                'stumpGrinding': { min: 100, max: 250 },
                'emergencyRemoval': { min: 500, max: 5000 } // Highly variable
            },
            accessibilityMultipliers: { 'easy': { min: 1.0, max: 1.0 }, 'moderate': { min: 1.2, max: 1.5 }, 'difficult': { min: 1.5, max: 2.5 } },
            conditionMultipliers: { 'healthy': { min: 1.0, max: 1.0 }, 'diseasedDead': { min: 1.2, max: 1.5 } },
            addOns: { debrisRemoval: { min: 150, max: 400 }, limbingChipping: { min: 100, max: 300 }, permitAssistance: { min: 50, max: 150 } },
            minimumJobFee: { min: 250, max: 500 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing;
            const serviceType = getElementValue('treeServiceType');
            state.numTreesStumps = getElementValue('treeCountValue');
            const accessibility = getElementValue('treeAccessibility');
            const condition = getElementValue('treeCondition');

            let baseMin = pricing.serviceTypeRates[serviceType].min;
            let baseMax = pricing.serviceTypeRates[serviceType].max;

            if (serviceType.startsWith('removal') || serviceType === 'stumpGrinding') { // Apply per count for removal/grinding
                baseMin *= state.numTreesStumps;
                baseMax *= state.numTreesStumps;
            }

            baseMin *= pricing.accessibilityMultipliers[accessibility].min; baseMax *= pricing.accessibilityMultipliers[accessibility].max;
            baseMin *= pricing.conditionMultipliers[condition].min; baseMax *= pricing.conditionMultipliers[condition].max;
            
            costMin += baseMin; costMax += baseMax;

            if (getElementValue('treeDebrisRemoval')) { costMin += pricing.addOns.debrisRemoval.min; costMax += pricing.addOns.debrisRemoval.max; }
            if (getElementValue('treeLimbingBranchChipping')) { costMin += pricing.addOns.limbingChipping.min; costMax += pricing.addOns.limbingChipping.max; }
            if (getElementValue('treePermitAssistance')) { costMin += pricing.addOns.permitAssistance.min; costMax += pricing.addOns.permitAssistance.max; }

            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            document.getElementById('treeServiceType').addEventListener('change', calculateOverallCost);
            document.getElementById('treeAccessibility').addEventListener('change', calculateOverallCost);
            document.getElementById('treeCondition').addEventListener('change', calculateOverallCost);
            document.getElementById('treeDebrisRemoval').addEventListener('change', calculateOverallCost);
            document.getElementById('treeLimbingBranchChipping').addEventListener('change', calculateOverallCost);
            document.getElementById('treePermitAssistance').addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() { /* No specific dynamic visibility beyond default */ }
    },
    'locksmith-services': {
        state: { numLocks: 1, repairHours: 1, numKeys: 1 },
        pricing: {
            serviceTypeRates: {
                'rekey': { min: 80, max: 150 }, 'lockReplace': { min: 100, max: 250 }, 'newInstall': { min: 150, max: 300 },
                'emergencyLockout': { min: 100, max: 300 }, 'keyDuplication': { min: 5, max: 20 }, 'otherRepair': { min: 0, max: 0 } // Hourly
            },
            hourlyRate: { min: 75, max: 120 }, // For otherRepair
            lockQualityMultipliers: { 'standard': { min: 1.0, max: 1.0 }, 'highSecurity': { min: 1.5, max: 2.5 }, 'commercial': { min: 1.8, max: 3.0 } },
            addOns: { brokenKeyExtraction: { min: 75, max: 150 }, securityAudit: { min: 100, max: 300 } },
            minimumJobFee: { min: 80, max: 150 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing;
            const serviceType = getElementValue('locksmithServiceType');
            state.numLocks = getElementValue('locksmithNumLocksValue');
            state.repairHours = getElementValue('locksmithRepairHours');
            state.numKeys = getElementValue('locksmithNumKeysValue');
            const lockQuality = getElementValue('locksmithLockQuality');

            let baseMin = 0; let baseMax = 0;
            if (serviceType === 'otherRepair') { baseMin = state.repairHours * pricing.hourlyRate.min; baseMax = state.repairHours * pricing.hourlyRate.max; }
            else if (serviceType === 'keyDuplication') { baseMin = state.numKeys * pricing.serviceTypeRates.keyDuplication.min; baseMax = state.numKeys * pricing.serviceTypeRates.keyDuplication.max; }
            else {
                baseMin = pricing.serviceTypeRates[serviceType].min * state.numLocks;
                baseMax = pricing.serviceTypeRates[serviceType].max * state.numLocks;
            }
            // Apply lock quality multiplier for relevant services
            if (serviceType !== 'keyDuplication' && serviceType !== 'emergencyLockout' && serviceType !== 'otherRepair') {
                baseMin *= pricing.lockQualityMultipliers[lockQuality].min;
                baseMax *= pricing.lockQualityMultipliers[lockQuality].max;
            }
            
            costMin += baseMin; costMax += baseMax;

            if (getElementValue('locksmithBrokenKeyExtraction')) { costMin += pricing.addOns.brokenKeyExtraction.min; costMax += pricing.addOns.brokenKeyExtraction.max; }
            if (getElementValue('locksmithSecurityAudit')) { costMin += pricing.addOns.securityAudit.min; costMax += pricing.addOns.securityAudit.max; }
            
            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const locksmithServiceTypeSelect = document.getElementById('locksmithServiceType');
            locksmithServiceTypeSelect.addEventListener('change', this.initDisplay);
            document.getElementById('locksmithLockQuality').addEventListener('change', calculateOverallCost);
            setupAddonVisibility('locksmithKeyExtraCopies', 'locksmithKeyExtraCopiesInputs', 'locksmithNumKeysValue');
            document.getElementById('locksmithBrokenKeyExtraction').addEventListener('change', calculateOverallCost);
            document.getElementById('locksmithSecurityAudit').addEventListener('change', calculateOverallCost);
            document.getElementById('locksmithRepairHours').addEventListener('input', calculateOverallCost); // Hourly input
        },
        initDisplay: function() {
            const serviceType = getElementValue('locksmithServiceType');
            const numLocksGroup = document.getElementById('locksmithNumLocksGroup');
            const repairHoursGroup = document.getElementById('locksmithRepairHoursGroup');
            const keyCopiesInputs = document.getElementById('locksmithKeyExtraCopiesInputs');

            // Hide/show numLocksGroup, repairHoursGroup, keyCopiesInputs
            if (serviceType === 'otherRepair') { numLocksGroup.classList.add('hidden'); repairHoursGroup.classList.remove('hidden'); }
            else if (serviceType === 'keyDuplication') { numLocksGroup.classList.add('hidden'); repairHoursGroup.classList.add('hidden'); keyCopiesInputs.classList.remove('hidden'); }
            else if (serviceType === 'emergencyLockout') { numLocksGroup.classList.add('hidden'); repairHoursGroup.classList.add('hidden'); }
            else { numLocksGroup.classList.remove('hidden'); repairHoursGroup.classList.add('hidden'); keyCopiesInputs.classList.add('hidden'); }
            keyCopiesInputs.classList.toggle('hidden', !document.getElementById('locksmithKeyExtraCopies').checked); // Ensure addon visibility
        }
    },
    'pet-services': {
        state: { duration: 1 }, // for pet sitting/boarding duration
        pricing: {
            groomingRates: { // Base per groom, by size
                'dog': { 'small': { min: 50, max: 80 }, 'medium': { min: 70, max: 100 }, 'large': { min: 90, max: 150 }, 'xLarge': { min: 120, max: 200 } },
                'cat': { 'small': { min: 60, max: 100 }, 'medium': { min: 80, max: 120 }, 'large': { min: 100, max: 150 } },
                'otherSmall': { min: 30, max: 70 }
            },
            groomingPackages: { 'basic': { min: 1.0, max: 1.0 }, 'full': { min: 1.2, max: 1.5 }, 'premium': { min: 1.5, max: 2.0 } },
            petSittingRates: { min: 40, max: 70 }, // Per night/day
            boardingRates: { min: 30, max: 60 }, // Per night/day
            daycareRates: { min: 25, max: 45 }, // Per day
            addOns: { specialNeeds: { min: 10, max: 30 }, extraPlayTime: { min: 15, max: 35 }, transportation: { min: 30, max: 75 } },
            minimumJobFee: { min: 50, max: 100 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing;
            const serviceType = getElementValue('petServiceType');
            const petType = getElementValue('petType');
            const petSize = getElementValue('petSize');
            const groomingPackage = getElementValue('petGroomingPackage');
            state.duration = getElementValue('petSittingBoardingDurationValue');

            let baseMin = 0; let baseMax = 0;

            if (serviceType === 'grooming') {
                const typeRates = pricing.groomingRates[petType];
                if (petType === 'dog' || petType === 'cat') {
                    baseMin = typeRates[petSize].min; baseMax = typeRates[petSize].max;
                } else { // Other small pet
                    baseMin = typeRates.min; baseMax = typeRates.max;
                }
                baseMin *= pricing.groomingPackages[groomingPackage].min;
                baseMax *= pricing.groomingPackages[groomingPackage].max;
            } else if (serviceType === 'petSitting') {
                baseMin = state.duration * pricing.petSittingRates.min; baseMax = state.duration * pricing.petSittingRates.max;
            } else if (serviceType === 'boarding') {
                baseMin = state.duration * pricing.boardingRates.min; baseMax = state.duration * pricing.boardingRates.max;
            } else if (serviceType === 'daycare') {
                baseMin = pricing.daycareRates.min; baseMax = pricing.daycareRates.max; // Per day, assuming 1 day default
            }
            costMin += baseMin; costMax += baseMax;

            if (getElementValue('petSpecialNeeds')) { costMin += pricing.addOns.specialNeeds.min; costMax += pricing.addOns.specialNeeds.max; }
            if (getElementValue('petExtraPlayTime')) { costMin += pricing.addOns.extraPlayTime.min; costMax += pricing.addOns.extraPlayTime.max; }
            if (getElementValue('petTransportation')) { costMin += pricing.addOns.transportation.min; costMax += pricing.addOns.transportation.max; }
            
            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const petServiceTypeSelect = document.getElementById('petServiceType');
            petServiceTypeSelect.addEventListener('change', this.initDisplay);
            document.getElementById('petType').addEventListener('change', this.initDisplay); // Changing pet type might show/hide size
            document.getElementById('petSize').addEventListener('change', calculateOverallCost);
            document.getElementById('petGroomingPackage').addEventListener('change', calculateOverallCost);
            setupAddonVisibility('petSittingBoardingDurationGroup', 'petSittingBoardingDurationInputs', 'petSittingBoardingDurationValue'); // Duration group
            document.getElementById('petSittingBoardingDurationValue').addEventListener('input', calculateOverallCost); // Ensure manual input updates
            document.getElementById('petSpecialNeeds').addEventListener('change', calculateOverallCost);
            document.getElementById('petExtraPlayTime').addEventListener('change', calculateOverallCost);
            document.getElementById('petTransportation').addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const serviceType = getElementValue('petServiceType');
            const petType = getElementValue('petType');
            const groomingPackageGroup = document.getElementById('petGroomingPackageGroup');
            const petSittingBoardingDurationGroup = document.getElementById('petSittingBoardingDurationGroup');
            const petSizeSelect = document.getElementById('petSize');

            // Toggle grooming package
            groomingPackageGroup.classList.toggle('hidden', serviceType !== 'grooming');

            // Toggle sitting/boarding duration
            petSittingBoardingDurationGroup.classList.toggle('hidden', serviceType !== 'petSitting' && serviceType !== 'boarding');

            // Toggle pet size based on pet type (only for dog/cat)
            petSizeSelect.closest('.rg-form-group').classList.toggle('hidden', petType === 'otherSmall');
        }
    },
    'landscaping-services': {
        state: { areaSqFt: 500, estimatedHours: 8, retainingWallLength: 10 },
        pricing: {
            projectTypeRates: {
                'newDesignInstall': { min: 5, max: 15 }, // Per sq.ft
                'renovation': { min: 3, max: 10 }, // Per sq.ft
                'gardenBedInstall': { min: 200, max: 800 }, // Flat fee per bed/small area
                'hardscapingInstall': { min: 10, max: 40 }, // Per sq.ft
                'irrigationInstall': { min: 1500, max: 4000 }, // Flat fee, then zones add-on from irrigation calc
                'otherCustom': { min: 0, max: 0 } // Hourly
            },
            hourlyRate: { min: 70, max: 120 },
            designComplexityMultipliers: { 'simple': { min: 1.0, max: 1.0 }, 'moderate': { min: 1.3, max: 1.6 }, 'complex': { min: 1.7, max: 2.2 } },
            addOns: { planting: { min: 1.0, max: 3.0 }, lighting: { min: 500, max: 1500 }, waterFeature: { min: 800, max: 3000 }, retainingWallPerFt: { min: 40, max: 100 } }, // Planting per sq.ft
            minimumJobFee: { min: 500, max: 1500 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing;
            const projectType = getElementValue('landscapingProjectType');
            state.areaSqFt = getElementValue('landscapingAreaSqFt');
            state.estimatedHours = getElementValue('landscapingEstimatedHours');
            const designComplexity = getElementValue('landscapingDesignComplexity');
            state.retainingWallLength = getElementValue('landscapingRetainingWallLength');

            let baseMin = 0; let baseMax = 0;
            if (projectType === 'otherCustom') { baseMin = state.estimatedHours * pricing.hourlyRate.min; baseMax = state.estimatedHours * pricing.hourlyRate.max; }
            else if (projectType === 'gardenBedInstall' || projectType === 'irrigationInstall') {
                baseMin = pricing.projectTypeRates[projectType].min; baseMax = pricing.projectTypeRates[projectType].max;
            } else { // Per sq.ft
                baseMin = state.areaSqFt * pricing.projectTypeRates[projectType].min;
                baseMax = state.areaSqFt * pricing.projectTypeRates[projectType].max;
            }
            
            baseMin *= pricing.designComplexityMultipliers[designComplexity].min;
            baseMax *= pricing.designComplexityMultipliers[designComplexity].max;
            costMin += baseMin; costMax += baseMax;

            if (getElementValue('landscapingPlanting')) { costMin += state.areaSqFt * pricing.addOns.planting.min; costMax += state.areaSqFt * pricing.addOns.planting.max; }
            if (getElementValue('landscapingLighting')) { costMin += pricing.addOns.lighting.min; costMax += pricing.addOns.lighting.max; }
            if (getElementValue('landscapingWaterFeature')) { costMin += pricing.addOns.waterFeature.min; costMax += pricing.addOns.waterFeature.max; }
            if (getElementValue('landscapingRetainingWall')) { costMin += state.retainingWallLength * pricing.addOns.retainingWallPerFt.min; costMax += state.retainingWallLength * pricing.addOns.retainingWallPerFt.max; }
            
            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const landscapingProjectTypeSelect = document.getElementById('landscapingProjectType');
            landscapingProjectTypeSelect.addEventListener('change', this.initDisplay);
            document.getElementById('landscapingAreaSqFt').addEventListener('input', calculateOverallCost);
            document.getElementById('landscapingEstimatedHours').addEventListener('input', calculateOverallCost);
            document.getElementById('landscapingDesignComplexity').addEventListener('change', calculateOverallCost);
            document.getElementById('landscapingPlanting').addEventListener('change', calculateOverallCost);
            document.getElementById('landscapingLighting').addEventListener('change', calculateOverallCost);
            document.getElementById('landscapingWaterFeature').addEventListener('change', calculateOverallCost);
            setupAddonVisibility('landscapingRetainingWall', 'landscapingRetainingWallInputs', 'landscapingRetainingWallLength');
        },
        initDisplay: function() {
            const projectType = getElementValue('landscapingProjectType');
            const areaSqFtGroup = document.getElementById('landscapingAreaSqFtGroup');
            const estimatedHoursGroup = document.getElementById('landscapingEstimatedHoursGroup');
            const retainingWallInputs = document.getElementById('landscapingRetainingWallInputs');

            if (projectType === 'otherCustom') { areaSqFtGroup.classList.add('hidden'); estimatedHoursGroup.classList.remove('hidden'); }
            else { estimatedHoursGroup.classList.add('hidden'); areaSqFtGroup.classList.remove('hidden'); }
            
            // Adjust visibility for hardscaping based on project type
            retainingWallInputs.classList.toggle('hidden', !document.getElementById('landscapingRetainingWall').checked);
        }
    },
    'handyman-services': {
        state: { estimatedHours: 2, numItems: 1 },
        pricing: {
            hourlyRate: { min: 50, max: 90 },
            fixedTaskRates: {
                'fixtureInstallation': { min: 100, max: 250 }, 'drywallRepair': { min: 75, max: 200 }, // Per hole/area
                'doorWindowRepair': { min: 150, max: 350 }, 'mounting': { min: 75, max: 150 },
                'furnitureAssembly': { min: 80, max: 200 }, 'minorPlumbingElectrical': { min: 120, max: 300 }
            },
            complexityMultipliers: { 'simple': { min: 1.0, max: 1.0 }, 'moderate': { min: 1.2, max: 1.5 }, 'complex': { min: 1.5, max: 2.0 } },
            addOns: { materialSourcing: { min: 30, max: 80 }, travelFee: { min: 40, max: 100 }, demolitionRemoval: { min: 75, max: 200 } },
            minimumJobFee: { min: 100, max: 250 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing;
            const serviceType = getElementValue('handymanServiceType');
            state.estimatedHours = getElementValue('handymanEstimatedHours');
            state.numItems = getElementValue('handymanNumItemsValue');
            const complexity = getElementValue('handymanComplexity');

            let baseMin = 0; let baseMax = 0;
            if (serviceType === 'hourly') { baseMin = state.estimatedHours * pricing.hourlyRate.min; baseMax = state.estimatedHours * pricing.hourlyRate.max; }
            else {
                baseMin = pricing.fixedTaskRates[serviceType].min; baseMax = pricing.fixedTaskRates[serviceType].max;
                if (serviceType === 'fixtureInstallation' || serviceType === 'mounting' || serviceType === 'furnitureAssembly') { // Multi-item tasks
                    baseMin *= state.numItems; baseMax *= state.numItems;
                }
            }
            
            baseMin *= pricing.complexityMultipliers[complexity].min; baseMax *= pricing.complexityMultipliers[complexity].max;
            costMin += baseMin; costMax += baseMax;

            if (getElementValue('handymanMaterialSourcing')) { costMin += pricing.addOns.materialSourcing.min; costMax += pricing.addOns.materialSourcing.max; }
            if (getElementValue('handymanTravelFee')) { costMin += pricing.addOns.travelFee.min; costMax += pricing.addOns.travelFee.max; }
            if (getElementValue('handymanDemolitionRemoval')) { costMin += pricing.addOns.demolitionRemoval.min; costMax += pricing.addOns.demolitionRemoval.max; }
            
            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const handymanServiceTypeSelect = document.getElementById('handymanServiceType');
            handymanServiceTypeSelect.addEventListener('change', this.initDisplay);
            document.getElementById('handymanEstimatedHours').addEventListener('input', calculateOverallCost);
            document.getElementById('handymanComplexity').addEventListener('change', calculateOverallCost);
            document.getElementById('handymanMaterialSourcing').addEventListener('change', calculateOverallCost);
            document.getElementById('handymanTravelFee').addEventListener('change', calculateOverallCost);
            document.getElementById('handymanDemolitionRemoval').addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const serviceType = getElementValue('handymanServiceType');
            const estimatedHoursGroup = document.getElementById('handymanEstimatedHoursGroup');
            const numItemsGroup = document.getElementById('handymanNumItemsGroup');

            if (serviceType === 'hourly') {
                estimatedHoursGroup.classList.remove('hidden'); numItemsGroup.classList.add('hidden');
            } else if (serviceType === 'fixtureInstallation' || serviceType === 'mounting' || serviceType === 'furnitureAssembly') {
                estimatedHoursGroup.classList.add('hidden'); numItemsGroup.classList.remove('hidden');
            } else {
                estimatedHoursGroup.classList.add('hidden'); numItemsGroup.classList.add('hidden');
            }
        }
    },
    'hvac': {
        state: { propertySize: 2000 },
        pricing: {
            diagnosticRepair: { min: 150, max: 300 }, // Diagnostic fee + initial repair base
            maintenanceTuneUp: { min: 100, max: 200 },
            newInstallationBase: { min: 3000, max: 8000 }, // Varies by system type
            ductworkRepair: { min: 500, max: 2000 }, // Flat fee or per section
            systemTypeAdjustments: {
                'centralAC': { min: 1.0, max: 1.0 }, 'furnace': { min: 0.9, max: 1.1 }, 'heatPump': { min: 1.1, max: 1.3 },
                'miniSplit': { min: 0.8, max: 1.0 }, 'boiler': { min: 1.5, max: 2.0 }
            },
            propertySizeMultipliers: { // For new installs/ductwork
                '500-1500': { min: 0.8, max: 0.9 }, '1501-3000': { min: 1.0, max: 1.0 }, '3001+': { min: 1.1, max: 1.3 } // Using ranges as keys
            },
            repairComplexityMultipliers: { 'minor': { min: 0.8, max: 1.0 }, 'moderate': { min: 1.2, max: 1.5 }, 'major': { min: 1.8, max: 2.5 } },
            addOns: { airQuality: { min: 200, max: 500 }, smartThermostat: { min: 150, max: 300 }, emergencyService: { min: 100, max: 250 }, permitRequired: { min: 50, max: 200 } },
            minimumJobFee: { min: 150, max: 300 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing;
            const serviceType = getElementValue('hvacServiceType');
            const systemType = getElementValue('hvacSystemType');
            state.propertySize = getElementValue('hvacPropertySize');
            const repairComplexity = getElementValue('hvacRepairComplexity');

            let baseMin = 0; let baseMax = 0;
            
            if (serviceType === 'diagnosticRepair') {
                baseMin = pricing.diagnosticRepair.min; baseMax = pricing.diagnosticRepair.max;
                baseMin *= pricing.repairComplexityMultipliers[repairComplexity].min;
                baseMax *= pricing.repairComplexityMultipliers[repairComplexity].max;
            } else if (serviceType === 'maintenanceTuneUp') {
                baseMin = pricing.maintenanceTuneUp.min; baseMax = pricing.maintenanceTuneUp.max;
            } else if (serviceType === 'newInstallation') {
                baseMin = pricing.newInstallationBase.min; baseMax = pricing.newInstallationBase.max;
                baseMin *= pricing.systemTypeAdjustments[systemType].min;
                baseMax *= pricing.systemTypeAdjustments[systemType].max;
                
                let sizeKey = '500-1500'; // Determine size key based on propertySize
                if (state.propertySize > 1500 && state.propertySize <= 3000) sizeKey = '1501-3000';
                else if (state.propertySize > 3000) sizeKey = '3001+';
                baseMin *= pricing.propertySizeMultipliers[sizeKey].min;
                baseMax *= pricing.propertySizeMultipliers[sizeKey].max;

            } else if (serviceType === 'ductwork') {
                baseMin = pricing.ductworkRepair.min; baseMax = pricing.ductworkRepair.max;
                let sizeKey = '500-1500';
                if (state.propertySize > 1500 && state.propertySize <= 3000) sizeKey = '1501-3000';
                else if (state.propertySize > 3000) sizeKey = '3001+';
                baseMin *= pricing.propertySizeMultipliers[sizeKey].min;
                baseMax *= pricing.propertySizeMultipliers[sizeKey].max;
            }
            costMin += baseMin; costMax += baseMax;

            if (getElementValue('hvacAirQuality')) { costMin += pricing.addOns.airQuality.min; costMax += pricing.addOns.airQuality.max; }
            if (getElementValue('hvacSmartThermostat')) { costMin += pricing.addOns.smartThermostat.min; costMax += pricing.addOns.smartThermostat.max; }
            if (getElementValue('hvacEmergencyService')) { costMin += pricing.addOns.emergencyService.min; costMax += pricing.addOns.emergencyService.max; }
            if (getElementValue('hvacPermitRequired')) { costMin += pricing.addOns.permitRequired.min; costMax += pricing.addOns.permitRequired.max; }

            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const hvacServiceTypeSelect = document.getElementById('hvacServiceType');
            hvacServiceTypeSelect.addEventListener('change', this.initDisplay);
            document.getElementById('hvacSystemType').addEventListener('change', calculateOverallCost);
            document.getElementById('hvacPropertySize').addEventListener('input', calculateOverallCost);
            document.getElementById('hvacRepairComplexity').addEventListener('change', calculateOverallCost);
            document.getElementById('hvacAirQuality').addEventListener('change', calculateOverallCost);
            document.getElementById('hvacSmartThermostat').addEventListener('change', calculateOverallCost);
            document.getElementById('hvacEmergencyService').addEventListener('change', calculateOverallCost);
            document.getElementById('hvacPermitRequired').addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const serviceType = getElementValue('hvacServiceType');
            const repairComplexityGroup = document.getElementById('hvacRepairComplexityGroup');
            if (serviceType === 'diagnosticRepair') { repairComplexityGroup.classList.remove('hidden'); }
            else { repairComplexityGroup.classList.add('hidden'); }
        }
    },
    'electrical-services': {
        state: { estimatedHours: 2, numUnits: 1 },
        pricing: {
            hourlyRate: { min: 75, max: 150 },
            fixedTaskRates: { // For per-unit/fixed services
                'outletSwitchInstall': { min: 100, max: 200 }, 'lightFixtureInstall': { min: 100, max: 250 },
                'panelUpgrade': { min: 1500, max: 3000 }, 'rewiring': { min: 5000, max: 15000 },
                'evCharger': { min: 500, max: 1200 }
            },
            complexityMultipliers: { 'simple': { min: 1.0, max: 1.0 }, 'moderate': { min: 1.2, max: 1.5 }, 'complex': { min: 1.5, max: 2.0 } },
            addOns: { permitInspection: { min: 75, max: 250 }, materialCostExtra: { min: 50, max: 500 }, emergencyService: { min: 100, max: 300 } },
            minimumJobFee: { min: 150, max: 300 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing;
            const serviceType = getElementValue('electricalServiceType');
            state.estimatedHours = getElementValue('electricalEstimatedHours');
            state.numUnits = getElementValue('electricalNumUnitsValue');
            const complexity = getElementValue('electricalComplexity');

            let baseMin = 0; let baseMax = 0;
            if (serviceType === 'repairTroubleshoot') { baseMin = state.estimatedHours * pricing.hourlyRate.min; baseMax = state.estimatedHours * pricing.hourlyRate.max; }
            else {
                baseMin = pricing.fixedTaskRates[serviceType].min; baseMax = pricing.fixedTaskRates[serviceType].max;
                if (serviceType === 'outletSwitchInstall' || serviceType === 'lightFixtureInstall') { // Per unit
                    baseMin *= state.numUnits; baseMax *= state.numUnits;
                }
            }
            baseMin *= pricing.complexityMultipliers[complexity].min; baseMax *= pricing.complexityMultipliers[complexity].max;
            costMin += baseMin; costMax += baseMax;

            if (getElementValue('electricalPermitInspection')) { costMin += pricing.addOns.permitInspection.min; costMax += pricing.addOns.permitInspection.max; }
            if (getElementValue('electricalMaterialCostExtra')) { costMin += pricing.addOns.materialCostExtra.min; costMax += pricing.addOns.materialCostExtra.max; }
            if (getElementValue('electricalEmergencyService')) { costMin += pricing.addOns.emergencyService.min; costMax += pricing.addOns.emergencyService.max; }

            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const electricalServiceTypeSelect = document.getElementById('electricalServiceType');
            electricalServiceTypeSelect.addEventListener('change', this.initDisplay);
            document.getElementById('electricalEstimatedHours').addEventListener('input', calculateOverallCost);
            document.getElementById('electricalComplexity').addEventListener('change', calculateOverallCost);
            document.getElementById('electricalPermitInspection').addEventListener('change', calculateOverallCost);
            document.getElementById('electricalMaterialCostExtra').addEventListener('change', calculateOverallCost);
            document.getElementById('electricalEmergencyService').addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const serviceType = getElementValue('electricalServiceType');
            const estimatedHoursGroup = document.getElementById('electricalEstimatedHoursGroup');
            const numUnitsGroup = document.getElementById('electricalNumUnitsGroup');

            if (serviceType === 'repairTroubleshoot') { estimatedHoursGroup.classList.remove('hidden'); numUnitsGroup.classList.add('hidden'); }
            else if (serviceType === 'outletSwitchInstall' || serviceType === 'lightFixtureInstall') { estimatedHoursGroup.classList.add('hidden'); numUnitsGroup.classList.remove('hidden'); }
            else { estimatedHoursGroup.classList.add('hidden'); numUnitsGroup.classList.add('hidden'); } // Other fixed tasks
        }
    },
    'roofing': {
        state: { areaSqFt: 1500 },
        pricing: {
            serviceTypeRates: {
                'repair': { min: 300, max: 1000 }, // Per repair complexity
                'replacement': { min: 4, max: 10 }, // Per sq.ft
                'inspection': { min: 150, max: 300 },
                'cleaning': { min: 0.30, max: 0.70 } // Per sq.ft
            },
            repairComplexityMultipliers: { 'minor': { min: 0.8, max: 1.0 }, 'moderate': { min: 1.2, max: 1.5 }, 'major': { min: 1.5, max: 2.0 } },
            materialMultipliers: { // For replacement
                'asphaltShingles': { min: 1.0, max: 1.0 }, 'metal': { min: 2.0, max: 3.5 }, 'tile': { min: 2.5, max: 4.0 },
                'woodShake': { min: 2.0, max: 3.0 }, 'flatRoof': { min: 1.5, max: 2.5 }
            },
            storyHeightMultipliers: { '1': { min: 1.0, max: 1.0 }, '2': { min: 1.15, max: 1.35 }, '3': { min: 1.4, max: 1.8 } },
            addOns: { oldRoofRemoval: { min: 1.0, max: 2.0 }, // per sqft
                       gutterWork: { min: 100, max: 300 }, skylightWork: { min: 200, max: 500 }, permitFees: { min: 75, max: 250 } },
            minimumJobFee: { min: 300, max: 600 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing;
            const serviceType = getElementValue('roofingServiceType');
            state.areaSqFt = getElementValue('roofingAreaSqFt');
            const repairComplexity = getElementValue('roofingRepairComplexity');
            const materialType = getElementValue('roofingMaterialType');
            const storyHeight = getElementValue('roofingStoryHeight');

            let baseMin = 0; let baseMax = 0;
            if (serviceType === 'repair') {
                baseMin = pricing.serviceTypeRates.repair.min; baseMax = pricing.serviceTypeRates.repair.max;
                baseMin *= pricing.repairComplexityMultipliers[repairComplexity].min; baseMax *= pricing.repairComplexityMultipliers[repairComplexity].max;
            } else if (serviceType === 'replacement') {
                baseMin = state.areaSqFt * pricing.serviceTypeRates.replacement.min; baseMax = state.areaSqFt * pricing.serviceTypeRates.replacement.max;
                baseMin *= pricing.materialMultipliers[materialType].min; baseMax *= pricing.materialMultipliers[materialType].max;
            } else if (serviceType === 'cleaning') {
                baseMin = state.areaSqFt * pricing.serviceTypeRates.cleaning.min; baseMax = state.areaSqFt * pricing.serviceTypeRates.cleaning.max;
            } else { // inspection
                baseMin = pricing.serviceTypeRates[serviceType].min; baseMax = pricing.serviceTypeRates[serviceType].max;
            }
            // Apply story height multiplier for replacement and cleaning (or full jobs)
            if (serviceType === 'replacement' || serviceType === 'cleaning' || serviceType === 'repair') { // Apply story height to full job
                baseMin *= pricing.storyHeightMultipliers[storyHeight].min; baseMax *= pricing.storyHeightMultipliers[storyHeight].max;
            }
            costMin += baseMin; costMax += baseMax;

            if (getElementValue('roofingOldRoofRemoval') && serviceType === 'replacement') { costMin += state.areaSqFt * pricing.addOns.oldRoofRemoval.min; costMax += state.areaSqFt * pricing.addOns.oldRoofRemoval.max; }
            if (getElementValue('roofingGutterWork')) { costMin += pricing.addOns.gutterWork.min; costMax += pricing.addOns.gutterWork.max; }
            if (getElementValue('roofingSkylightWork')) { costMin += pricing.addOns.skylightWork.min; costMax += pricing.addOns.skylightWork.max; }
            if (getElementValue('roofingPermitFees')) { costMin += pricing.addOns.permitFees.min; costMax += pricing.addOns.permitFees.max; }
            
            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const roofingServiceTypeSelect = document.getElementById('roofingServiceType');
            roofingServiceTypeSelect.addEventListener('change', this.initDisplay);
            document.getElementById('roofingAreaSqFt').addEventListener('input', calculateOverallCost);
            document.getElementById('roofingRepairComplexity').addEventListener('change', calculateOverallCost);
            document.getElementById('roofingMaterialType').addEventListener('change', calculateOverallCost);
            document.getElementById('roofingStoryHeight').addEventListener('change', calculateOverallCost);
            document.getElementById('roofingOldRoofRemoval').addEventListener('change', calculateOverallCost);
            document.getElementById('roofingGutterWork').addEventListener('change', calculateOverallCost);
            document.getElementById('roofingSkylightWork').addEventListener('change', calculateOverallCost);
            document.getElementById('roofingPermitFees').addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const serviceType = getElementValue('roofingServiceType');
            const areaSqFtGroup = document.getElementById('roofingAreaSqFtGroup');
            const repairComplexityGroup = document.getElementById('roofingRepairComplexityGroup');
            const materialTypeGroup = document.getElementById('roofingMaterialTypeGroup');
            const storyHeightGroup = document.getElementById('roofingStoryHeightGroup');
            
            // Toggle visibility for repair complexity
            repairComplexityGroup.classList.toggle('hidden', serviceType !== 'repair');

            // Toggle visibility for area, material, and story height based on service type
            const showAreaMaterialStory = (serviceType === 'replacement' || serviceType === 'cleaning');
            areaSqFtGroup.classList.toggle('hidden', !showAreaMaterialStory);
            materialTypeGroup.classList.toggle('hidden', !showAreaMaterialStory);
            storyHeightGroup.classList.toggle('hidden', !showAreaMaterialStory);
        }
    },
    'plumbing': {
        state: { estimatedHours: 1, numFixtures: 1 },
        pricing: {
            hourlyRate: { min: 80, max: 180 }, // For general hourly / troubleshooting
            fixedTaskRates: {
                'clogDrain': { min: 100, max: 300 }, 'leakyFaucet': { min: 100, max: 250 },
                'waterHeater': { min: 400, max: 1500 }, // Repair or replacement
                'newFixtureInstall': { min: 150, max: 400 }, // Per fixture
                'pipeRepairReplace': { min: 200, max: 800 },
                'sewerLine': { min: 1000, max: 5000 } // Major work
            },
            accessLevelMultipliers: { 'easy': { min: 1.0, max: 1.0 }, 'moderate': { min: 1.2, max: 1.5 }, 'difficult': { min: 1.5, max: 2.0 } },
            addOns: { emergencyService: { min: 150, max: 400 }, cameraInspection: { min: 200, max: 500 }, permitRequired: { min: 75, max: 250 } },
            minimumJobFee: { min: 150, max: 300 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing;
            const serviceType = getElementValue('plumbingServiceType');
            state.estimatedHours = getElementValue('plumbingEstimatedHours');
            state.numFixtures = getElementValue('plumbingNumFixturesValue');
            const accessLevel = getElementValue('plumbingAccessLevel');

            let baseMin = 0; let baseMax = 0;
            if (serviceType === 'other') { baseMin = state.estimatedHours * pricing.hourlyRate.min; baseMax = state.estimatedHours * pricing.hourlyRate.max; }
            else if (serviceType === 'newFixtureInstall') {
                baseMin = pricing.fixedTaskRates[serviceType].min * state.numFixtures;
                baseMax = pricing.fixedTaskRates[serviceType].max * state.numFixtures;
            }
            else { baseMin = pricing.fixedTaskRates[serviceType].min; baseMax = pricing.fixedTaskRates[serviceType].max; }

            baseMin *= pricing.accessLevelMultipliers[accessLevel].min;
            baseMax *= pricing.accessLevelMultipliers[accessLevel].max;
            costMin += baseMin; costMax += baseMax;

            if (getElementValue('plumbingEmergencyService')) { costMin += pricing.addOns.emergencyService.min; costMax += pricing.addOns.emergencyService.max; }
            if (getElementValue('plumbingCameraInspection')) { costMin += pricing.addOns.cameraInspection.min; costMax += pricing.addOns.cameraInspection.max; }
            if (getElementValue('plumbingPermitRequired')) { costMin += pricing.addOns.permitRequired.min; costMax += pricing.addOns.permitRequired.max; }
            
            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const plumbingServiceTypeSelect = document.getElementById('plumbingServiceType');
            plumbingServiceTypeSelect.addEventListener('change', this.initDisplay);
            document.getElementById('plumbingEstimatedHours').addEventListener('input', calculateOverallCost);
            document.getElementById('plumbingAccessLevel').addEventListener('change', calculateOverallCost);
            document.getElementById('plumbingEmergencyService').addEventListener('change', calculateOverallCost);
            document.getElementById('plumbingCameraInspection').addEventListener('change', calculateOverallCost);
            document.getElementById('plumbingPermitRequired').addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const serviceType = getElementValue('plumbingServiceType');
            const estimatedHoursGroup = document.getElementById('plumbingEstimatedHoursGroup');
            const numFixturesGroup = document.getElementById('plumbingNumFixturesGroup');

            if (serviceType === 'other') { estimatedHoursGroup.classList.remove('hidden'); numFixturesGroup.classList.add('hidden'); }
            else if (serviceType === 'newFixtureInstall') { estimatedHoursGroup.classList.add('hidden'); numFixturesGroup.classList.remove('hidden'); }
            else { estimatedHoursGroup.classList.add('hidden'); numFixturesGroup.classList.add('hidden'); }
        }
    }
};

// --- UNIVERSAL MASTER CONTROL FUNCTIONS ---
function updateEstimatedCost(min, max) {
    min = Math.max(0, min);
    max = Math.max(0, max);
    estimatedCostDisplay.textContent = `$${Math.round(min)} – $${Math.round(max)}`;
}

function calculateOverallCost() {
    let costs = { min: 0, max: 0 };
    if (industries[currentIndustry] && industries[currentIndustry].calculate) {
        costs = industries[currentIndustry].calculate();
    }

    universalDiscountPercent = parseFloat(universalDiscountInput.value) || 0;
    const discountFactor = (100 - universalDiscountPercent) / 100;
    costs.min *= discountFactor;
    costs.max *= discountFactor;

    updateEstimatedCost(costs.min, costs.max);
}

function showIndustryForm(industryId) {
    // Hide all form sections
    document.querySelectorAll('.rg-calc-form-section').forEach(form => form.classList.add('hidden'));

    // Deactivate all industry buttons
    document.querySelectorAll('.rg-calc-industry-btn').forEach(btn => btn.classList.remove('active'));

    // Show selected form and activate its button
    const selectedForm = document.getElementById(`${industryId}-form`);
    const selectedButton = document.getElementById(`btn${industryId.charAt(0).toUpperCase() + industryId.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase())}`);
    
    if (selectedForm) { selectedForm.classList.remove('hidden'); }
    if (selectedButton) { selectedButton.classList.add('active'); }

    currentIndustry = industryId; // Update global state

    // Initialize display of the newly visible form
    if (industries[currentIndustry] && industries[currentIndustry].initDisplay) {
        industries[currentIndustry].initDisplay();
    }
    calculateOverallCost(); // Recalculate cost for the newly displayed industry
}


// --- INITIAL SETUP (ON PAGE LOAD) ---
document.addEventListener('DOMContentLoaded', () => {
    // Attach event listeners for industry selection buttons
    const industryButtons = document.querySelectorAll('.rg-calc-industry-btn-group .rg-calc-industry-btn');
    industryButtons.forEach(button => {
        const industryId = button.id.replace('btn', '').toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase(); // Converts btnCleaning to cleaning
        button.addEventListener('click', () => showIndustryForm(industryId));
    });

    // Initialize listeners for each industry's specific calculator
    Object.values(industries).forEach(industry => {
        if (industry.initListeners) { industry.initListeners(); }
    });

    // Universal discount input listener
    universalDiscountInput.addEventListener('input', calculateOverallCost);

    // Get current URL path to determine initial calculator to show
    const path = window.location.pathname;
    let initialIndustry = 'cleaning'; // Default fallback

    // Map URL paths to industry IDs
    const pathToIndustryMap = {
        '/industry/cleaning': 'cleaning',
        '/industry/lawn-care': 'lawn-care',
        '/industry/painting': 'painting',
        '/industry/recycling': 'recycling',
        '/industry/window-cleaning': 'window-cleaning',
        '/industry/pooper-scooper': 'pooper-scooper',
        '/industry/property-maintenance': 'property-maintenance',
        '/industry/pool-spa': 'pool-spa',
        '/industry/pressure-washing': 'pressure-washing',
        '/industry/paving': 'paving',
        '/industry/installation': 'installation',
        '/industry/junk-removal': 'junk-removal',
        '/industry/irrigation': 'irrigation',
        '/industry/fence': 'fence',
        '/industry/janitorial': 'janitorial',
        '/industry/flooring': 'flooring',
        '/industry/dog-walking': 'dog-walking',
        '/industry/appliance-repair': 'appliance-repair',
        '/industry/chimney-sweep': 'chimney-sweep',
        '/industry/carpet-cleaning': 'carpet-cleaning',
        '/industry/carpentry': 'carpentry',
        '/industry/garage-services': 'garage-services',
        '/industry/professional-services': 'professional', // Note: hyphenated in URL, "professional" for object key
        '/industry/tree-services': 'tree-services',
        '/industry/locksmith-services': 'locksmith-services',
        '/industry/pet-services': 'pet-services',
        '/industry/landscaping-services': 'landscaping-services',
        '/industry/handyman-services': 'handyman-services',
        '/industry/hvac-services': 'hvac', // Note: hyphenated in URL, "hvac" for object key
        '/industry/electrical-services': 'electrical-services',
        '/industry/roofing-services': 'roofing-services',
        '/industry/plumbing': 'plumbing'
    };

    // Attempt to determine initial industry from URL
    for (const urlPath in pathToIndustryMap) {
        if (path.includes(urlPath)) {
            initialIndustry = pathToIndustryMap[urlPath];
            break;
        }
    }

    showIndustryForm(initialIndustry); // Show the determined initial form

    // Final check to apply base units for Lawn Care (if it's the initial industry)
    // This is a specific hack as Lawn Care uses data-baseUnit which needs init on load
    if (initialIndustry === 'lawn-care' && industries['lawn-care'].elements) {
        const unitElements = document.querySelectorAll('#lawn-care-form .rg-calc-unit');
        unitElements.forEach(unitSpan => {
            const currentValInput = unitSpan.previousElementSibling;
            if (currentValInput) {
                unitSpan.dataset.baseUnit = unitSpan.textContent; // Store original unit (sq.ft or acres)
            }
        });
        industries['lawn-care'].initDisplay(); // Re-run Lawn Care initDisplay to sync units on load
    }
});

