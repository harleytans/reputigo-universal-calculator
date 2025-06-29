/*
 * script.js for Reputigo Universal Service Cost Calculator
 * Hosted on GitHub Pages / Netlify / Replit
 *
 * This file contains all JavaScript logic for the calculator components,
 * including state management, pricing data, calculation functions, and event listeners
 * for all supported service industries.
 */

// --- GLOBAL CONSTANTS ---
const SQFT_PER_ACRE = 43560;

// --- GLOBAL STATE & ELEMENTS (references populated on DOMContentLoaded) ---
let currentIndustry = 'cleaning'; // Default active industry
let universalDiscountPercent = 0;

const globalElements = {
    estimatedCostDisplay: null,
    universalDiscountInput: null,
    calculatorFormsContainer: null,
    industryButtons: {},
    formSections: {},
};

// Generic helper to get element value
function getElementValue(element) {
    if (!element) return null;
    if (element.type === 'number' || element.type === 'text') {
        return parseFloat(element.value) || 0;
    }
    if (element.type === 'checkbox') {
        return element.checked;
    }
    return element.value;
}

// --- MASTER DATA STRUCTURE (ALL CALCULATORS' STATE, ELEMENTS, PRICING, AND CALC LOGIC) ---
const industries = {
    'cleaning': {
        state: { bedrooms: 1, bathrooms: 1, squareFootage: 1000, isSqFtMode: false },
        elements: {}, // Populated in collectElements
        pricing: {
            base: { 'weekly': { min: 50, max: 65 }, 'monthly': { min: 70, max: 90 }, 'oneTime': { min: 100, max: 130 } },
            perRoom: { min: 15, max: 20 }, perBathroom: { min: 10, max: 15 },
            perSqFt: { min: 0.05, max: 0.15 },
            addOns: { floorCleaning: { min: 10, max: 15 }, appliances: { min: 20, max: 25 }, windowCleaning: { min: 15, max: 20 }, laundry: { min: 15, max: 20 } }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing;
            const elements = this.elements;

            const visitType = getElementValue(elements.visitTypeSelect);
            state.isSqFtMode = getElementValue(elements.toggle);
            state.squareFootage = getElementValue(elements.squareFootageField);
            state.bedrooms = parseFloat(elements.bedroomsValueSpan.textContent) || 0;
            state.bathrooms = parseFloat(elements.bathroomsValueSpan.textContent) || 0;

            const baseCosts = pricing.base[visitType];
            if (baseCosts) { costMin += baseCosts.min; costMax += baseCosts.max; }

            if (state.isSqFtMode) { costMin += Math.round(state.squareFootage * pricing.perSqFt.min); costMax += Math.round(state.squareFootage * pricing.perSqFt.max); }
            else { costMin += state.bedrooms * pricing.perRoom.min; costMax += state.bedrooms * pricing.perRoom.max; costMin += state.bathrooms * pricing.perBathroom.min; costMax += state.bathrooms * pricing.perBathroom.max; }
            
            if (getElementValue(elements.floorCleaningCheckbox)) { costMin += pricing.addOns.floorCleaning.min; costMax += pricing.addOns.floorCleaning.max; }
            if (getElementValue(elements.appliancesCheckbox)) { costMin += pricing.addOns.appliances.min; costMax += pricing.addOns.appliances.max; }
            if (getElementValue(elements.windowCleaningCheckbox)) { costMin += pricing.addOns.windowCleaning.min; costMax += pricing.addOns.windowCleaning.max; }
            if (getElementValue(elements.laundryCheckbox)) { costMin += pricing.addOns.laundry.min; costMax += pricing.addOns.laundry.max; }
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const elements = this.elements;
            elements.visitTypeSelect.addEventListener('change', calculateOverallCost);
            elements.floorCleaningCheckbox.addEventListener('change', calculateOverallCost);
            elements.appliancesCheckbox.addEventListener('change', calculateOverallCost);
            elements.windowCleaningCheckbox.addEventListener('change', calculateOverallCost);
            elements.laundryCheckbox.addEventListener('change', calculateOverallCost);
            elements.squareFootageField.addEventListener('input', calculateOverallCost);
            elements.toggle.addEventListener('change', this.initDisplay); // Calls initDisplay to handle toggle visuals
        },
        initDisplay: function() {
            const elements = this.elements;
            this.state.isSqFtMode = getElementValue(elements.toggle);
            
            if (this.state.isSqFtMode) {
                elements.roomsLabel.classList.remove('rg-calc-active-toggle-text'); elements.sqFtLabel.classList.add('rg-calc-active-toggle-text');
                elements.roomBasedInputs.classList.add('hidden'); elements.bathroomInputs.classList.add('hidden'); elements.squareFootageInput.classList.remove('hidden');
            } else {
                elements.roomsLabel.classList.add('rg-calc-active-toggle-text'); elements.sqFtLabel.classList.remove('rg-calc-active-toggle-text');
                elements.roomBasedInputs.classList.remove('hidden'); elements.bathroomInputs.classList.remove('hidden'); elements.squareFootageInput.classList.add('hidden');
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
            const elements = this.elements;
            this.state.isAcresMode = getElementValue(elements.areaToggle);
            const isAcresMode = this.state.isAcresMode;

            const getCostForLawnAreaService = (areaInputEl, sqFtCosts, acreCosts) => {
                const area = getElementValue(areaInputEl);
                return isAcresMode ? { min: area * acreCosts.min, max: area * acreCosts.max } : { min: area * sqFtCosts.min, max: area * sqFtCosts.max };
            };

            if (getElementValue(elements.lawnMowingCheckbox)) { const mowingCost = getCostForLawnAreaService(elements.lawnMowingAreaInput, pricing.lawnMowingSqFt, pricing.lawnMowingAcre); costMin += mowingCost.min; costMax += mowingCost.max; }
            if (getElementValue(elements.lawnAerationCheckbox)) {
                const aerationArea = getElementValue(elements.lawnAerationAreaInput); const aerationType = getElementValue(elements.lawnAerationTypeSelect);
                let a_min, a_max;
                if (isAcresMode) { a_min = aerationArea * (aerationType === 'liquid' ? pricing.lawnAerationLiquidAcre.min : pricing.lawnAerationCoreAcre.min); a_max = aerationArea * (aerationType === 'liquid' ? pricing.lawnAerationLiquidAcre.max : pricing.lawnAerationCoreAcre.max); }
                else { a_min = aerationArea * (aerationType === 'liquid' ? pricing.lawnAerationLiquidSqFt.min : pricing.lawnAerationCoreSqFt.min); a_max = aerationArea * (aerationType === 'liquid' ? pricing.lawnAerationLiquidSqFt.max : pricing.lawnAerationCoreSqFt.max); }
                costMin += a_min; costMax += a_max;
            }
            if (getElementValue(elements.lawnDethatchingCheckbox)) { const dethatchingCost = getCostForLawnAreaService(elements.lawnDethatchingAreaInput, pricing.dethatchingSqFt, pricing.dethatchingAcre); costMin += dethatchingCost.min; costMax += dethatchingCost.max; }
            if (getElementValue(elements.lawnFertilizationCheckbox)) { const fertilizationCost = getCostForLawnAreaService(elements.lawnFertilizationAreaInput, pricing.fertilizationSqFt, pricing.fertilizationAcre); costMin += fertilizationCost.min; costMax += fertilizationCost.max; }
            if (getElementValue(elements.lawnMulchCleanUpCheckbox)) { const amount = getElementValue(elements.lawnMulchCleanUpAmountInput); costMin += amount * pricing.mulchCleanUpBags.min; costMax += amount * pricing.mulchCleanUpBags.max; }
            if (getElementValue(elements.lawnSeedingCheckbox)) { const seedingCost = getCostForLawnAreaService(elements.lawnSeedingAreaInput, pricing.seedingSqFt, pricing.seedingAcre); costMin += seedingCost.min; costMax += seedingCost.max; }
            if (getElementValue(elements.lawnLeafRemovalCheckbox)) { const hours = getElementValue(elements.lawnLeafRemovalHoursInput); costMin += hours * pricing.leafRemovalHours.min; costMax += hours * pricing.leafRemovalHours.max; }
            if (getElementValue(elements.lawnYardCleanupCheckbox)) { const hours = getElementValue(elements.lawnYardCleanupHoursInput); costMin += hours * pricing.yardCleanupHours.min; costMax += hours * pricing.yardCleanupHours.max; }
            if (getElementValue(elements.lawnWeedControlCheckbox)) { const weedControlCost = getCostForLawnAreaService(elements.lawnWeedControlAreaInput, pricing.weedControlSqFt, pricing.weedControlAcre); costMin += weedControlCost.min; costMax += weedControlCost.max; }
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const elements = this.elements;
            elements.areaToggle.addEventListener('change', this.initDisplay);
            
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
            const elements = this.elements;
            this.state.isAcresMode = getElementValue(elements.areaToggle);
            const isAcresMode = this.state.isAcresMode;
            
            if (isAcresMode) { elements.acresLabel.classList.add('rg-calc-active-toggle-text'); elements.sqFtLabel.classList.remove('rg-calc-active-toggle-text'); }
            else { elements.sqFtLabel.classList.add('rg-calc-active-toggle-text'); elements.acresLabel.classList.remove('rg-calc-active-toggle-text'); }

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
            const serviceMapping = {
                lawnMowing: elements.lawnMowingInputs, lawnAeration: elements.lawnAerationInputs, dethatching: elements.lawnDethatchingInputs, fertilization: elements.lawnFertilizationInputs, mulchCleanUp: elements.lawnMulchCleanUpInputs, seeding: elements.lawnSeedingInputs, leafRemoval: elements.lawnLeafRemovalInputs, yardCleanup: elements.lawnYardCleanupInputs, weedControl: elements.weedControlInputs
            };
            for (const key in serviceMapping) {
                const checkbox = document.getElementById(key); // Checkbox ID directly
                const inputsDiv = serviceMapping[key];
                if (checkbox && inputsDiv) {
                    inputsDiv.style.display = checkbox.checked ? 'block' : 'none';
                }
            }
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
            const state = this.state; const pricing = this.pricing; const elements = this.elements;
            
            state.isRoomsMode = getElementValue(elements.areaToggle);
            const currentAreaOrRooms = getElementValue(elements.areaValueInput);
            const serviceType = getElementValue(elements.serviceTypeSelect);
            const numCoats = getElementValue(elements.numCoatsSelect);
            const paintQuality = getElementValue(elements.paintQualitySelect);
            
            let baseMin = 0; let baseMax = 0;

            if (state.isRoomsMode) { state.numRooms = currentAreaOrRooms; baseMin = pricing.basePerRoom[serviceType].min * state.numRooms; baseMax = pricing.basePerRoom[serviceType].max * state.numRooms; }
            else { state.areaValue = currentAreaOrRooms; baseMin = pricing.basePerSqFt[serviceType].min * state.areaValue; baseMax = pricing.basePerSqFt[serviceType].max * state.areaValue; }
            
            baseMin *= pricing.coatsFactor[numCoats].min; baseMax *= pricing.coatsFactor[numCoats].max;
            baseMin *= pricing.paintQualityFactor[paintQuality].min; baseMax *= pricing.paintQualityFactor[paintQuality].max;
            costMin += baseMin; costMax += baseMax;
            
            if (getElementValue(elements.wallPrepCheckbox)) { if (state.isRoomsMode) { costMin += state.numRooms * 150 * pricing.addOns.wallPrep.min; costMax += state.numRooms * 150 * pricing.addOns.wallPrep.max; } else { costMin += state.areaValue * pricing.addOns.wallPrep.min; costMax += state.areaValue * pricing.addOns.wallPrep.max; } }
            if (getElementValue(elements.trimPaintingCheckbox)) { if (state.isRoomsMode) { costMin += state.numRooms * 100 * pricing.addOns.trimPainting.min; costMax += state.numRooms * 100 * pricing.addOns.trimPainting.max; } else { costMin += state.areaValue * pricing.addOns.trimPainting.min; costMax += state.areaValue * pricing.addOns.trimPainting.max; } }
            if (getElementValue(elements.ceilingPaintingCheckbox)) { if (state.isRoomsMode) { costMin += state.numRooms * 200 * pricing.addOns.ceilingPainting.min; costMax += state.numRooms * 200 * pricing.addOns.ceilingPainting.max; } else { costMin += state.areaValue * pricing.addOns.ceilingPainting.min; costMax += state.areaValue * pricing.addOns.ceilingPainting.max; } }
            if (getElementValue(elements.deckStainingCheckbox)) { if (state.isRoomsMode) { costMin += state.numRooms * 100 * pricing.addOns.deckStaining.min; costMax += state.numRooms * 100 * pricing.addOns.deckStaining.max; } else { costMin += state.areaValue * pricing.addOns.deckStaining.min; costMax += state.areaValue * pricing.addOns.deckStaining.max; } }
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const elements = this.elements;
            elements.areaToggle.addEventListener('change', this.initDisplay);
            elements.areaValueInput.addEventListener('input', calculateOverallCost);
            elements.serviceTypeSelect.addEventListener('change', calculateOverallCost);
            elements.numCoatsSelect.addEventListener('change', calculateOverallCost);
            elements.paintQualitySelect.addEventListener('change', calculateOverallCost);
            elements.wallPrepCheckbox.addEventListener('change', calculateOverallCost);
            elements.trimPaintingCheckbox.addEventListener('change', calculateOverallCost);
            elements.ceilingPaintingCheckbox.addEventListener('change', calculateOverallCost);
            elements.deckStainingCheckbox.addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const elements = this.elements;
            this.state.isRoomsMode = getElementValue(elements.areaToggle);
            
            if (this.state.isRoomsMode) {
                elements.roomsLabel.classList.add('rg-calc-active-toggle-text'); elements.sqFtLabel.classList.remove('rg-calc-active-toggle-text');
                elements.areaLabel.textContent = 'Number of Rooms:'; elements.areaUnitSpan.textContent = 'rooms';
                elements.areaValueInput.value = this.state.numRooms; elements.areaValueInput.min = "1";
            } else {
                elements.sqFtLabel.classList.add('rg-calc-active-toggle-text'); elements.roomsLabel.classList.remove('rg-calc-active-toggle-text');
                elements.areaLabel.textContent = 'Area (Sq.Ft.):'; elements.areaUnitSpan.textContent = 'sq.ft';
                elements.areaValueInput.value = this.state.areaValue; elements.areaValueInput.min = "1";
            }
        }
    },
    'recycling': {
        state: { numStandardBins: 0, numAppliances: 0, numElectronics: 0, numTires: 0, numFurniture: 0 },
        pricing: {
            standardBin: { 'oneTime': { min: 20, max: 35 }, 'weekly': { min: 10, max: 15 }, 'biWeekly': { min: 15, max: 25 }, 'monthly': { min: 25, max: 40 } },
            specialtyItems: { appliance: { min: 50, max: 100 }, electronics: { min: 15, max: 50 }, tires: { min: 10, max: 25 }, furniture: { min: 40, max: 80 } },
            additionalServices: { documentShredding: { min: 75, max: 150 }, hazardousWaste: { min: 100, max: 300 } }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing; const elements = this.elements;
            const frequency = getElementValue(elements.pickupFrequencySelect);
            state.numStandardBins = getElementValue(elements.numStandardBinsValueSpan);
            state.numAppliances = getElementValue(elements.numAppliancesInput);
            state.numElectronics = getElementValue(elements.numElectronicsInput);
            state.numTires = getElementValue(elements.numTiresInput);
            state.numFurniture = getElementValue(elements.numFurnitureInput);

            if (state.numStandardBins > 0) {
                const binCost = pricing.standardBin[frequency];
                if (binCost) { costMin += state.numStandardBins * binCost.min; costMax += state.numStandardBins * binCost.max; }
            }
            if (getElementValue(elements.removeApplianceCheckbox)) { costMin += state.numAppliances * pricing.specialtyItems.appliance.min; costMax += state.numAppliances * pricing.specialtyItems.appliance.max; }
            if (getElementValue(elements.removeElectronicsCheckbox)) { costMin += state.numElectronics * pricing.specialtyItems.electronics.min; costMax += state.numElectronics * pricing.specialtyItems.electronics.max; }
            if (getElementValue(elements.removeTiresCheckbox)) { costMin += state.numTires * pricing.specialtyItems.tires.min; costMax += state.numTires * pricing.specialtyItems.tires.max; }
            if (getElementValue(elements.removeFurnitureCheckbox)) { costMin += state.numFurniture * pricing.specialtyItems.furniture.min; costMax += state.numFurniture * pricing.specialtyItems.furniture.max; }
            if (getElementValue(elements.documentShreddingCheckbox)) { costMin += pricing.additionalServices.documentShredding.min; costMax += pricing.additionalServices.documentShredding.max; }
            if (getElementValue(elements.hazardousWasteCheckbox)) { costMin += pricing.additionalServices.hazardousWaste.min; costMax += pricing.additionalServices.hazardousWaste.max; }
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const elements = this.elements;
            elements.pickupFrequencySelect.addEventListener('change', calculateOverallCost);
            setupAddonVisibility('recyclingRemoveAppliance', 'recyclingApplianceInputs', 'recyclingNumAppliances');
            setupAddonVisibility('recyclingRemoveElectronics', 'recyclingElectronicsInputs', 'recyclingNumElectronics');
            setupAddonVisibility('recyclingRemoveTires', 'recyclingTiresInputs', 'recyclingNumTires');
            setupAddonVisibility('recyclingRemoveFurniture', 'recyclingFurnitureInputs', 'recyclingNumFurniture');
            elements.documentShreddingCheckbox.addEventListener('change', calculateOverallCost);
            elements.hazardousWasteCheckbox.addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const elements = this.elements;
            elements.applianceInputsDiv.classList.toggle('hidden', !getElementValue(elements.removeApplianceCheckbox));
            elements.electronicsInputsDiv.classList.toggle('hidden', !getElementValue(elements.removeElectronicsCheckbox));
            elements.tiresInputsDiv.classList.toggle('hidden', !getElementValue(elements.removeTiresCheckbox));
            elements.furnitureInputsDiv.classList.toggle('hidden', !getElementValue(elements.removeFurnitureCheckbox));
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
            const state = this.state; const pricing = this.pricing; const elements = this.elements;
            
            state.numStandardWindows = parseFloat(elements.numStandardWindowsValueSpan.textContent) || 0;
            state.numFrenchPanes = parseFloat(elements.numFrenchPanesValueSpan.textContent) || 0;
            state.numSlidingDoors = parseFloat(elements.numSlidingDoorsValueSpan.textContent) || 0;
            state.numScreens = getElementValue(elements.numScreensInput);
            state.numHardWaterWindows = getElementValue(elements.numHardWaterWindowsInput);
            state.numSkylights = getElementValue(elements.numSkylightsInput);

            const storyHeight = getElementValue(elements.storyHeightSelect);
            const cleaningType = getElementValue(elements.cleaningTypeSelect);

            let baseWindowCostMin = (state.numStandardWindows * pricing.baseCosts.standardWindow.min) + (state.numFrenchPanes * pricing.baseCosts.frenchPane.min) + (state.numSlidingDoors * pricing.baseCosts.slidingDoor.min);
            let baseWindowCostMax = (state.numStandardWindows * pricing.baseCosts.standardWindow.max) + (state.numFrenchPanes * pricing.baseCosts.frenchPane.max) + (state.numSlidingDoors * pricing.baseCosts.slidingDoor.max);
            
            baseWindowCostMin *= pricing.storyHeightMultipliers[storyHeight].min; baseWindowCostMax *= pricing.storyHeightMultipliers[storyHeight].max;
            baseWindowCostMin *= pricing.cleaningTypeAdjustments[cleaningType].min; baseWindowCostMax *= pricing.cleaningTypeAdjustments[cleaningType].max;
            costMin += baseWindowCostMin; costMax += baseWindowCostMax;
            
            if (getElementValue(elements.screenCleaningCheckbox)) { costMin += state.numScreens * pricing.addOns.screenCleaning.min; costMax += state.numScreens * pricing.addOns.screenCleaning.max; }
            if (getElementValue(elements.trackCleaningCheckbox)) { costMin += pricing.addOns.trackCleaning.min; costMax += pricing.addOns.trackCleaning.max; }
            if (getElementValue(elements.hardWaterCheckbox)) { costMin += state.numHardWaterWindows * pricing.addOns.hardWaterStainRemoval.min; costMax += state.numHardWaterWindows * pricing.addOns.hardWaterStainRemoval.max; }
            if (getElementValue(elements.skylightCleaningCheckbox)) { costMin += state.numSkylights * pricing.addOns.skylightCleaning.min; costMax += state.numSkylights * pricing.addOns.skylightCleaning.max; }
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const elements = this.elements;
            elements.storyHeightSelect.addEventListener('change', calculateOverallCost);
            elements.cleaningTypeSelect.addEventListener('change', calculateOverallCost);
            setupAddonVisibility('windowScreenCleaningCheckbox', 'windowScreenCleaningInputs', 'windowNumScreens');
            elements.trackCleaningCheckbox.addEventListener('change', calculateOverallCost);
            setupAddonVisibility('windowHardWaterCheckbox', 'windowHardWaterInputs', 'windowNumHardWaterWindows');
            setupAddonVisibility('windowSkylightCleaningCheckbox', 'windowSkylightCleaningInputs', 'windowNumSkylights');
        },
        initDisplay: function() {
            const elements = this.elements;
            elements.screenCleaningInputsDiv.classList.toggle('hidden', !getElementValue(elements.screenCleaningCheckbox));
            elements.hardWaterInputsDiv.classList.toggle('hidden', !getElementValue(elements.hardWaterCheckbox));
            elements.skylightCleaningInputsDiv.classList.toggle('hidden', !getElementValue(elements.skylightCleaningCheckbox));
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
            const state = this.state; const pricing = this.pricing; const elements = this.elements;
            const frequency = getElementValue(elements.serviceFrequencySelect);
            const yardSize = getElementValue(elements.yardSizeSelect);
            const initialCleanupCondition = getElementValue(elements.initialCleanupConditionSelect);
            state.numDogs = parseFloat(elements.numDogsValueSpan.textContent) || 0;

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
            if (getElementValue(elements.wasteHaulingCheckbox)) { costMin += pricing.addOns.wasteHauling.min; costMax += pricing.addOns.wasteHauling.max; }
            if (getElementValue(elements.yardDeodorizingCheckbox)) { costMin += pricing.addOns.yardDeodorizing.min; costMax += pricing.addOns.yardDeodorizing.max; }
            if (getElementValue(elements.patioHosingCheckbox)) { costMin += pricing.addOns.patioHosing.min; costMax += pricing.addOns.patioHosing.max; }
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const elements = this.elements;
            elements.serviceFrequencySelect.addEventListener('change', this.initDisplay);
            elements.yardSizeSelect.addEventListener('change', calculateOverallCost);
            elements.initialCleanupConditionSelect.addEventListener('change', calculateOverallCost);
            elements.wasteHaulingCheckbox.addEventListener('change', calculateOverallCost);
            elements.yardDeodorizingCheckbox.addEventListener('change', calculateOverallCost);
            elements.patioHosingCheckbox.addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const elements = this.elements;
            const frequency = getElementValue(elements.serviceFrequencySelect);
            if (frequency === 'oneTime') { elements.yardSizeGroup.classList.add('hidden'); elements.initialCleanupConditionGroup.classList.remove('hidden'); }
            else { elements.yardSizeGroup.classList.remove('hidden'); elements.initialCleanupConditionGroup.classList.add('hidden'); }
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
            const state = this.state; const pricing = this.pricing; const elements = this.elements;
            const propertyType = getElementValue(elements.propertyTypeSelect);
            const serviceFrequency = getElementValue(elements.serviceFrequencySelect);
            state.estimatedHours = parseFloat(elements.estimatedHoursValueSpan.textContent) || 0;
            const hourlyRate = getElementValue(elements.hourlyRateInput);

            costMin += state.estimatedHours * hourlyRate; costMax += state.estimatedHours * hourlyRate;
            costMin *= pricing.propertyTypeMultipliers[propertyType].min; costMax *= pricing.propertyTypeMultipliers[propertyType].max;
            if (serviceFrequency !== 'oneTime') {
                costMin *= pricing.frequencyAdjustments[serviceFrequency].min; costMax *= pricing.frequencyAdjustments[serviceFrequency].max;
            } else {
                costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            }
            if (getElementValue(elements.gutterCleaningCheckbox)) { costMin += pricing.addOns.gutterCleaning.min; costMax += pricing.addOns.gutterCleaning.max; }
            if (getElementValue(elements.basicLandscapingCheckbox)) { costMin += pricing.addOns.basicLandscaping.min; costMax += pricing.addOns.basicLandscaping.max; }
            if (getElementValue(elements.filterReplacementCheckbox)) { costMin += pricing.addOns.filterReplacement.min; costMax += pricing.addOns.filterReplacement.max; }
            if (getElementValue(elements.pressureWashingSmallCheckbox)) { costMin += pricing.addOns.pressureWashingSmall.min; costMax += pricing.addOns.pressureWashingSmall.max; }
            if (getElementValue(elements.minorPlumbingCheckbox)) { costMin += pricing.addOns.minorPlumbing.min; costMax += pricing.addOns.minorPlumbing.max; }
            if (getElementValue(elements.minorElectricalCheckbox)) { costMin += pricing.addOns.minorElectrical.min; costMax += pricing.addOns.minorElectrical.max; }
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const elements = this.elements;
            elements.propertyTypeSelect.addEventListener('change', calculateOverallCost);
            elements.serviceFrequencySelect.addEventListener('change', calculateOverallCost);
            elements.hourlyRateInput.addEventListener('input', calculateOverallCost);
            elements.gutterCleaningCheckbox.addEventListener('change', calculateOverallCost);
            elements.basicLandscapingCheckbox.addEventListener('change', calculateOverallCost);
            elements.filterReplacementCheckbox.addEventListener('change', calculateOverallCost);
            elements.pressureWashingSmallCheckbox.addEventListener('change', calculateOverallCost);
            elements.minorPlumbingCheckbox.addEventListener('change', calculateOverallCost);
            elements.minorElectricalCheckbox.addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() { /* No specific dynamic visibility beyond default */ }
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
            const pricing = this.pricing; const elements = this.elements;
            const poolSpaType = getElementValue(elements.poolSpaTypeSelect);
            const poolSize = getElementValue(elements.poolSizeSelect);
            const serviceFrequency = getElementValue(elements.poolSpaServiceFrequencySelect);

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
            if (getElementValue(elements.poolSpaOpeningClosingCheckbox)) {
                const ocType = getElementValue(elements.openingClosingTypeSelect);
                if (ocType === 'opening' || ocType === 'both') { costMin += pricing.addOns.poolOpening.min; costMax += pricing.addOns.poolOpening.max; }
                if (ocType === 'closing' || ocType === 'both') { costMin += pricing.addOns.poolClosing.min; costMax += pricing.addOns.poolClosing.max; }
            }
            if (getElementValue(elements.filterCleaningCheckbox)) { costMin += pricing.addOns.filterCleaning.min; costMax += pricing.addOns.filterCleaning.max; }
            if (getElementValue(elements.algaeTreatmentCheckbox)) { costMin += pricing.addOns.algaeTreatment.min; costMax += pricing.addOns.algaeTreatment.max; }
            if (getElementValue(elements.equipmentDiagnosticsCheckbox)) { costMin += pricing.addOns.equipmentDiagnostics.min; costMax += pricing.addOns.equipmentDiagnostics.max; }
            if (getElementValue(elements.saltCellCleaningCheckbox)) { costMin += pricing.addOns.saltCellCleaning.min; costMax += pricing.addOns.saltCellCleaning.max; }
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const elements = this.elements;
            elements.poolSpaTypeSelect.addEventListener('change', calculateOverallCost);
            elements.poolSizeSelect.addEventListener('change', calculateOverallCost);
            elements.poolSpaServiceFrequencySelect.addEventListener('change', calculateOverallCost);
            setupAddonVisibility('poolSpaOpeningClosing', 'poolSpaOpeningClosingInputs', 'poolSpaOpeningClosingType');
            elements.openingClosingTypeSelect.addEventListener('change', calculateOverallCost);
            elements.filterCleaningCheckbox.addEventListener('change', calculateOverallCost);
            elements.algaeTreatmentCheckbox.addEventListener('change', calculateOverallCost);
            elements.equipmentDiagnosticsCheckbox.addEventListener('change', calculateOverallCost);
            elements.saltCellCleaningCheckbox.addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const elements = this.elements;
            elements.poolSpaOpeningClosingInputs.classList.toggle('hidden', !getElementValue(elements.poolSpaOpeningClosingCheckbox));
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
            const state = this.state; const pricing = this.pricing; const elements = this.elements;
            const surfaceType = getElementValue(elements.surfaceTypeSelect);
            state.areaValue = getElementValue(elements.areaValueInput);
            state.hourlyValue = getElementValue(elements.hourlyValueInput);
            const materialType = getElementValue(elements.materialTypeSelect);
            const dirtCondition = getElementValue(elements.dirtConditionSelect);
            const storyHeight = getElementValue(elements.storyHeightSelect);

            let baseMin = 0; let baseMax = 0;
            if (surfaceType === 'other') { baseMin = state.hourlyValue * pricing.hourlyRate.min; baseMax = state.hourlyValue * pricing.hourlyRate.max; }
            else {
                baseMin = state.areaValue * pricing.baseRatesPerSqFt[surfaceType].min; baseMax = state.areaValue * pricing.baseRatesPerSqFt[surfaceType].max;
                baseMin *= pricing.conditionMultipliers[dirtCondition].min; baseMax *= pricing.conditionMultipliers[dirtCondition].max;
                if (surfaceType === 'siding' || surfaceType === 'roof') { baseMin *= pricing.storyHeightMultipliers[storyHeight].min; baseMax *= pricing.storyHeightMultipliers[storyHeight].max; }
                baseMin *= pricing.materialAdjustments[materialType].min; baseMax *= pricing.materialAdjustments[materialType].max;
            }
            costMin += baseMin; costMax += baseMax;
            if (getElementValue(elements.sealingCheckbox)) { const sealingArea = (surfaceType === 'driveway' || surfaceType === 'patio' || surfaceType === 'deck') ? state.areaValue : 0; costMin += sealingArea * pricing.addOns.sealing.min; costMax += sealingArea * pricing.addOns.sealing.max; }
            if (getElementValue(elements.gutterBrighteningCheckbox)) { costMin += pricing.addOns.gutterBrightening.min; costMax += pricing.addOns.gutterBrightening.max; }
            if (getElementValue(elements.moldMildewTreatmentCheckbox)) { costMin += pricing.addOns.moldMildewTreatment.min; costMax += pricing.addOns.moldMildewTreatment.max; }
            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const elements = this.elements;
            elements.surfaceTypeSelect.addEventListener('change', this.initDisplay); // Calls initDisplay for visibility
            elements.areaValueInput.addEventListener('input', calculateOverallCost);
            elements.hourlyValueInput.addEventListener('input', calculateOverallCost);
            elements.materialTypeSelect.addEventListener('change', calculateOverallCost);
            elements.dirtConditionSelect.addEventListener('change', calculateOverallCost);
            elements.storyHeightSelect.addEventListener('change', calculateOverallCost);
            elements.sealingCheckbox.addEventListener('change', calculateOverallCost);
            elements.gutterBrighteningCheckbox.addEventListener('change', calculateOverallCost);
            elements.moldMildewTreatmentCheckbox.addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const elements = this.elements;
            const currentSurfaceType = getElementValue(elements.surfaceTypeSelect);
            if (currentSurfaceType === 'other') {
                elements.areaInputGroup.classList.add('hidden'); elements.materialTypeGroup.classList.add('hidden'); elements.storyHeightGroup.classList.add('hidden');
                elements.hourlyInputGroup.classList.remove('hidden');
            } else {
                elements.areaInputGroup.classList.remove('hidden'); elements.materialTypeGroup.classList.remove('hidden'); elements.hourlyInputGroup.classList.add('hidden');
                if (currentSurfaceType === 'siding' || currentSurfaceType === 'roof') { elements.storyHeightGroup.classList.remove('hidden'); } else { elements.storyHeightGroup.classList.add('hidden'); }
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
            const state = this.state; const pricing = this.pricing; const elements = this.elements;
            const serviceType = getElementValue(elements.serviceTypeSelect);
            const surfaceType = getElementValue(elements.surfaceTypeSelect);
            const material = getElementValue(elements.materialSelect);
            state.areaValue = getElementValue(elements.areaValueInput);
            const thickness = getElementValue(elements.thicknessSelect);
            const sitePreparation = getElementValue(elements.sitePreparationSelect);
            state.numPatches = parseFloat(elements.numPatchesValueSpan.textContent) || 0;

            let basePavingMin = 0; let basePavingMax = 0;
            if (serviceType === 'repairPatching') { basePavingMin = pricing.repairPatchCost.min * state.numPatches; basePavingMax = pricing.repairPatchCost.max * state.numPatches; }
            else {
                basePavingMin = pricing.materials[material].min * state.areaValue; basePavingMax = pricing.materials[material].max * state.areaValue;
                basePavingMin *= pricing.serviceTypeMultipliers[serviceType].min; basePavingMax *= pricing.serviceTypeMultipliers[serviceType].max;
                if (material === 'asphalt' || material === 'concrete') { basePavingMin *= pricing.thicknessMultipliers[thickness].min; basePavingMax *= pricing.thicknessMultipliers[thickness].max; }
                basePavingMin *= pricing.sitePrepMultipliers[sitePreparation].min; basePavingMax *= pricing.sitePrepMultipliers[sitePreparation].max;
            }
            costMin += basePavingMin; costMax += basePavingMax;
            if (getElementValue(elements.sealcoatingCheckbox) && material === 'asphalt') { costMin += state.areaValue * pricing.addOns.sealcoating.min; costMax += state.areaValue * pricing.addOns.sealcoating.max; }
            if (getElementValue(elements.drainageSolutionsCheckbox)) { costMin += pricing.addOns.drainageSolutions.min; costMax += pricing.addOns.drainageSolutions.max; }
            if (getElementValue(elements.edgingBordersCheckbox)) { costMin += Math.sqrt(state.areaValue) * 4 * pricing.addOns.edgingBorders.min; costMax += Math.sqrt(state.areaValue) * 4 * pricing.addOns.edgingBorders.max; }
            if (getElementValue(elements.lineStripingCheckbox) && surfaceType === 'parkingLot') { costMin += pricing.addOns.lineStriping.min; costMax += pricing.addOns.lineStriping.max; }
            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const elements = this.elements;
            elements.serviceTypeSelect.addEventListener('change', this.initDisplay);
            elements.surfaceTypeSelect.addEventListener('change', calculateOverallCost);
            elements.materialSelect.addEventListener('change', this.initDisplay); // calls initDisplay for thickness visibility
            elements.areaValueInput.addEventListener('input', calculateOverallCost);
            elements.thicknessSelect.addEventListener('change', calculateOverallCost);
            elements.sitePreparationSelect.addEventListener('change', calculateOverallCost);
            elements.sealcoatingCheckbox.addEventListener('change', calculateOverallCost);
            elements.drainageSolutionsCheckbox.addEventListener('change', calculateOverallCost);
            elements.edgingBordersCheckbox.addEventListener('change', calculateOverallCost);
            elements.lineStripingCheckbox.addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const elements = this.elements;
            const serviceType = getElementValue(elements.serviceTypeSelect);
            const material = getElementValue(elements.materialSelect);
            
            if (serviceType === 'repairPatching') {
                elements.repairPatchingGroup.classList.remove('hidden');
                elements.areaInputGroup.classList.add('hidden'); elements.thicknessGroup.classList.add('hidden');
            } else {
                elements.repairPatchingGroup.classList.add('hidden');
                elements.areaInputGroup.classList.remove('hidden');
                if (material === 'asphalt' || material === 'concrete') { elements.thicknessGroup.classList.remove('hidden'); } else { elements.thicknessGroup.classList.add('hidden'); }
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
            const state = this.state; const pricing = this.pricing; const elements = this.elements;
            const type = getElementValue(elements.typeSelect);
            state.numUnits = parseFloat(elements.numUnitsValueSpan.textContent) || 0;
            state.estimatedHours = getElementValue(elements.estimatedHoursInput);
            const complexity = getElementValue(elements.complexitySelect);
            const removalNeeded = getElementValue(elements.removalNeededCheckbox);

            let baseMin = 0; let baseMax = 0;
            if (type === 'other') { baseMin = state.estimatedHours * pricing.hourlyRate.min; baseMax = state.estimatedHours * pricing.hourlyRate.max; }
            else {
                baseMin = pricing.baseCosts[type].min * state.numUnits; baseMax = pricing.baseCosts[type].max * state.numUnits;
                baseMin *= pricing.complexityMultipliers[complexity].min; baseMax *= pricing.complexityMultipliers[complexity].max;
            }
            costMin += baseMin; costMax += baseMax;
            if (removalNeeded) { costMin += pricing.removalCost.min; costMax += pricing.removalCost.max; }
            if (getElementValue(elements.disposalOfOldItemsCheckbox)) { costMin += pricing.addOns.disposalOfOldItems.min; costMax += pricing.addOns.disposalOfOldItems.max; }
            if (getElementValue(elements.minorModificationsCheckbox)) { costMin += pricing.addOns.minorModifications.min; costMax += pricing.addOns.minorModifications.max; }
            if (getElementValue(elements.testingCalibrationCheckbox)) { costMin += pricing.addOns.testingCalibration.min; costMax += pricing.addOns.testingCalibration.max; }
            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const elements = this.elements;
            elements.typeSelect.addEventListener('change', this.initDisplay);
            elements.estimatedHoursInput.addEventListener('input', calculateOverallCost);
            elements.complexitySelect.addEventListener('change', calculateOverallCost);
            elements.removalNeededCheckbox.addEventListener('change', calculateOverallCost);
            elements.disposalOfOldItemsCheckbox.addEventListener('change', calculateOverallCost);
            elements.minorModificationsCheckbox.addEventListener('change', calculateOverallCost);
            elements.testingCalibrationCheckbox.addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const elements = this.elements;
            const type = getElementValue(elements.typeSelect);
            if (type === 'other') { elements.numUnitsGroup.classList.add('hidden'); elements.estimatedHoursGroup.classList.remove('hidden'); }
            else { elements.numUnitsGroup.classList.remove('hidden'); elements.estimatedHoursGroup.classList.add('hidden'); }
        }
    },
    'junk-removal': {
        state: { mattresses: 0, tires: 0, heavyItems: 0, demolitionHours: 1 },
        pricing: {
            volumeRates: {
                'minCharge': { min: 75, max: 150 }, 'oneEighth': { min: 100, max: 250 },
                'oneQuarter': { min: 150, max: 350 }, 'half': { min: 300, max: 600 },
                'threeQuarter': { min: 350, max: 700 }, 'full': { min: 400, max: 800 }
            },
            typeMultipliers: { 'general': { min: 1.0, max: 1.0 }, 'furniture': { min: 1.1, max: 1.2 }, 'appliances': { min: 1.0, max: 1.1 }, 'yardWaste': { min: 0.9, max: 1.0 }, 'construction': { min: 1.2, max: 1.5 }, 'mixed': { min: 1.0, max: 1.2 } },
            accessibilityMultipliers: { 'curbside': { min: 1.0, max: 1.0 }, 'basementAttic': { min: 1.2, max: 1.4 }, 'difficult': { min: 1.5, max: 1.8 } },
            surcharges: { mattress: { min: 25, max: 75 }, tire: { min: 10, max: 30 }, heavyItem: { min: 50, max: 150 } },
            additionalServices: { demolitionHourly: { min: 50, max: 100 }, cleanupAfter: { min: 50, max: 150 } },
            minimumJobFee: { min: 75, max: 150 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing; const elements = this.elements;
            const volume = getElementValue(elements.volumeSelect);
            const type = getElementValue(elements.typeSelect);
            const accessibility = getElementValue(elements.accessibilitySelect);
            
            let baseMin = pricing.volumeRates[volume].min; let baseMax = pricing.volumeRates[volume].max;
            baseMin *= pricing.typeMultipliers[type].min; baseMax *= pricing.typeMultipliers[type].max;
            baseMin *= pricing.accessibilityMultipliers[accessibility].min; baseMax *= pricing.accessibilityMultipliers[accessibility].max;
            costMin += baseMin; costMax += baseMax;

            state.mattresses = parseFloat(elements.mattressesValueSpan.textContent) || 0;
            state.tires = parseFloat(elements.tiresValueSpan.textContent) || 0;
            state.heavyItems = parseFloat(elements.heavyItemsValueSpan.textContent) || 0;
            state.demolitionHours = getElementValue(elements.demolitionHoursInput);

            if (getElementValue(elements.mattressSurchargeCheckbox)) { costMin += state.mattresses * pricing.surcharges.mattress.min; costMax += state.mattresses * pricing.surcharges.mattress.max; }
            if (getElementValue(elements.tireSurchargeCheckbox)) { costMin += state.tires * pricing.surcharges.tire.min; costMax += state.tires * pricing.surcharges.tire.max; }
            if (getElementValue(elements.heavyItemSurchargeCheckbox)) { costMin += state.heavyItems * pricing.surcharges.heavyItem.min; costMax += state.heavyItems * pricing.surcharges.heavyItem.max; }
            if (getElementValue(elements.demolitionCheckbox)) { costMin += state.demolitionHours * pricing.additionalServices.demolitionHourly.min; costMax += state.demolitionHours * pricing.additionalServices.demolitionHourly.max; }
            if (getElementValue(elements.cleanUpAfterCheckbox)) { costMin += pricing.additionalServices.cleanupAfter.min; costMax += pricing.additionalServices.cleanupAfter.max; }

            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return {min: costMin, max: costMax};
        },
        initListeners: function() {
            const elements = this.elements;
            elements.volumeSelect.addEventListener('change', calculateOverallCost);
            elements.typeSelect.addEventListener('change', calculateOverallCost);
            elements.accessibilitySelect.addEventListener('change', calculateOverallCost);
            setupAddonVisibility('junkRemovalMattressSurcharge', 'junkRemovalMattressInputs', 'junkRemovalMattressesValue');
            setupAddonVisibility('junkRemovalTireSurcharge', 'junkRemovalTireInputs', 'junkRemovalTiresValue');
            setupAddonVisibility('junkRemovalHeavyItemSurcharge', 'junkRemovalHeavyItemInputs', 'junkRemovalHeavyItemsValue');
            setupAddonVisibility('junkRemovalDemolition', 'junkRemovalDemolitionInputs', 'junkRemovalDemolitionHours');
            elements.demolitionHoursInput.addEventListener('input', calculateOverallCost);
            elements.cleanUpAfterCheckbox.addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const elements = this.elements;
            elements.mattressInputsDiv.classList.toggle('hidden', !getElementValue(elements.mattressSurchargeCheckbox));
            elements.tireInputsDiv.classList.toggle('hidden', !getElementValue(elements.tireSurchargeCheckbox));
            elements.heavyItemInputsDiv.classList.toggle('hidden', !getElementValue(elements.heavyItemSurchargeCheckbox));
            elements.demolitionInputsDiv.classList.toggle('hidden', !getElementValue(elements.demolitionCheckbox));
        }
    },
    'irrigation': {
        state: { numZones: 4, estimatedHours: 1 },
        pricing: {
            serviceTypeRates: {
                'newInstallation': { min: 100, max: 250, perZoneMin: 50, perZoneMax: 100 },
                'repairTroubleshooting': { min: 80, max: 150 },
                'seasonalMaintenance': { min: 75, max: 150 },
                'systemAudit': { min: 150, max: 300 }
            },
            propertySizeMultipliers: { 'small': { min: 1.0, max: 1.0 }, 'medium': { min: 1.2, max: 1.4 }, 'large': { min: 1.5, max: 1.8 } },
            hourlyRate: { min: 60, max: 100 },
            addOns: { dripSystem: { min: 200, max: 500 }, rainSensor: { min: 100, max: 200 }, backflowTesting: { min: 75, max: 150 } },
            minimumJobFee: { min: 75, max: 150 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing; const elements = this.elements;
            const serviceType = getElementValue(elements.serviceTypeSelect);
            state.numZones = parseFloat(elements.numZonesValueSpan.textContent) || 0;
            state.estimatedHours = getElementValue(elements.estimatedHoursInput);
            const propertySize = getElementValue(elements.propertySizeSelect);

            const sizeMultiplier = pricing.propertySizeMultipliers[propertySize];

            if (serviceType === 'newInstallation') {
                costMin += pricing.serviceTypeRates.newInstallation.min; costMax += pricing.serviceTypeRates.newInstallation.max;
                costMin += state.numZones * pricing.serviceTypeRates.newInstallation.perZoneMin;
                costMax += state.numZones * pricing.serviceTypeRates.newInstallation.perZoneMax;
                costMin *= sizeMultiplier.min; costMax *= sizeMultiplier.max;
            } else if (serviceType === 'repairTroubleshooting' || serviceType === 'systemAudit') {
                costMin += state.estimatedHours * pricing.hourlyRate.min; costMax += state.estimatedHours * pricing.hourlyRate.max;
                costMin *= sizeMultiplier.min; costMax *= sizeMultiplier.max;
            } else if (serviceType === 'seasonalMaintenance') {
                costMin += pricing.serviceTypeRates.seasonalMaintenance.min; costMax += pricing.serviceTypeRates.seasonalMaintenance.max;
                costMin *= sizeMultiplier.min; costMax *= sizeMultiplier.max;
            }

            if (getElementValue(elements.dripSystemCheckbox)) { costMin += pricing.addOns.dripSystem.min; costMax += pricing.addOns.dripSystem.max; }
            if (getElementValue(elements.rainSensorCheckbox)) { costMin += pricing.addOns.rainSensor.min; costMax += pricing.addOns.rainSensor.max; }
            if (getElementValue(elements.backflowTestingCheckbox)) { costMin += pricing.addOns.backflowTesting.min; costMax += pricing.addOns.backflowTesting.max; }

            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const elements = this.elements;
            elements.serviceTypeSelect.addEventListener('change', this.initDisplay);
            elements.estimatedHoursInput.addEventListener('input', calculateOverallCost);
            elements.propertySizeSelect.addEventListener('change', calculateOverallCost);
            elements.dripSystemCheckbox.addEventListener('change', calculateOverallCost);
            elements.rainSensorCheckbox.addEventListener('change', calculateOverallCost);
            elements.backflowTestingCheckbox.addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const elements = this.elements;
            const serviceType = getElementValue(elements.serviceTypeSelect);
            if (serviceType === 'newInstallation') {
                elements.numZonesGroup.classList.remove('hidden'); elements.estimatedHoursGroup.classList.add('hidden');
            } else if (serviceType === 'repairTroubleshooting' || serviceType === 'systemAudit') {
                elements.numZonesGroup.classList.add('hidden'); elements.estimatedHoursGroup.classList.remove('hidden');
            } else { // Seasonal Maintenance
                elements.numZonesGroup.classList.add('hidden'); elements.estimatedHoursGroup.classList.add('hidden');
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
            addOns: { oldFenceRemoval: { min: 50, max: 100 }, postCaps: { min: 10, max: 30 } },
            minimumJobFee: { min: 200, max: 500 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing; const elements = this.elements;
            const serviceType = getElementValue(elements.serviceTypeSelect);
            state.linearFeet = getElementValue(elements.linearFeetInput);
            const material = getElementValue(elements.materialSelect);
            const height = getElementValue(elements.heightSelect);
            const repairSeverity = getElementValue(elements.repairSeveritySelect);
            state.numGates = parseFloat(elements.numGatesValueSpan.textContent) || 0;

            let baseMin = 0; let baseMax = 0;

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

            if (getElementValue(elements.gateInstallationCheckbox)) {
                costMin += state.numGates * pricing.gateInstallation.min;
                costMax += state.numGates * pricing.gateInstallation.max;
            }
            if (getElementValue(elements.oldFenceRemovalCheckbox) && serviceType !== 'removal') { costMin += pricing.addOns.oldFenceRemoval.min; costMax += pricing.addOns.oldFenceRemoval.max; }
            if (getElementValue(elements.postCapsCheckbox)) { costMin += state.linearFeet * pricing.addOns.postCaps.min; costMax += state.linearFeet * pricing.addOns.postCaps.max; }
            
            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const elements = this.elements;
            elements.serviceTypeSelect.addEventListener('change', this.initDisplay);
            elements.linearFeetInput.addEventListener('input', calculateOverallCost);
            elements.materialSelect.addEventListener('change', calculateOverallCost);
            elements.heightSelect.addEventListener('change', calculateOverallCost);
            elements.repairSeveritySelect.addEventListener('change', calculateOverallCost);
            elements.gateInstallationCheckbox.addEventListener('change', this.initDisplay);
            elements.oldFenceRemovalCheckbox.addEventListener('change', calculateOverallCost);
            elements.postCapsCheckbox.addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const elements = this.elements;
            const serviceType = getElementValue(elements.serviceTypeSelect);
            
            if (serviceType === 'repair') {
                elements.repairSeverityGroup.classList.remove('hidden');
                elements.linearFeetGroup.classList.add('hidden');
                elements.materialGroup.classList.add('hidden');
                elements.heightSelect.closest('.rg-form-group').classList.add('hidden');
            } else {
                elements.repairSeverityGroup.classList.add('hidden');
                elements.linearFeetGroup.classList.remove('hidden');
                elements.materialGroup.classList.remove('hidden');
                elements.heightSelect.closest('.rg-form-group').classList.remove('hidden');
            }
            elements.gateInstallationInputsDiv.classList.toggle('hidden', !getElementValue(elements.gateInstallationCheckbox));
        }
    },
    'janitorial': {
        state: { areaSqFt: 2000, numRestrooms: 1 },
        pricing: {
            baseRatesPerSqFtPerMonth: { 'office': { min: 0.10, max: 0.20 }, 'retail': { min: 0.15, max: 0.25 }, 'medical': { min: 0.20, max: 0.35 }, 'restaurant': { min: 0.25, max: 0.40 }, 'industrial': { min: 0.10, max: 0.25 }, 'other': { min: 0.15, max: 0.30 } },
            frequencyMultipliers: { 'daily': { min: 4.0, max: 5.0 }, 'weekly': { min: 1.0, max: 1.0 }, 'biWeekly': { min: 0.6, max: 0.7 }, 'monthly': { min: 0.3, max: 0.4 }, 'oneTime': { min: 0.5, max: 0.8 } },
            perRestroomCost: { min: 20, max: 50 },
            addOns: { floorCare: { min: 0.05, max: 0.15 }, windowCleaning: { min: 0.03, max: 0.08 }, trashRemoval: { min: 30, max: 80 }, suppliesProvided: { min: 0.10, max: 0.20 } },
            minimumJobFee: { min: 200, max: 500 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing; const elements = this.elements;
            const propertyType = getElementValue(elements.propertyTypeSelect);
            state.areaSqFt = getElementValue(elements.areaSqFtInput);
            const serviceFrequency = getElementValue(elements.serviceFrequencySelect);
            state.numRestrooms = parseFloat(elements.numRestroomsValueSpan.textContent) || 0;

            let baseRateMin = pricing.baseRatesPerSqFtPerMonth[propertyType].min * state.areaSqFt;
            let baseRateMax = pricing.baseRatesPerSqFtPerMonth[propertyType].max * state.areaSqFt;

            if (serviceFrequency === 'oneTime') {
                costMin += baseRateMin * pricing.frequencyMultipliers.oneTime.min; costMax += baseRateMax * pricing.frequencyMultipliers.oneTime.max;
            } else {
                costMin += baseRateMin * pricing.frequencyMultipliers[serviceFrequency].min; costMax += baseRateMax * pricing.frequencyMultipliers[serviceFrequency].max;
            }

            costMin += state.numRestrooms * pricing.perRestroomCost.min * (serviceFrequency === 'oneTime' ? 1 : (serviceFrequency === 'daily' ? 20 : (serviceFrequency === 'weekly' ? 4 : (serviceFrequency === 'biWeekly' ? 2 : 1))));
            costMax += state.numRestrooms * pricing.perRestroomCost.max * (serviceFrequency === 'oneTime' ? 1 : (serviceFrequency === 'daily' ? 20 : (serviceFrequency === 'weekly' ? 4 : (serviceFrequency === 'biWeekly' ? 2 : 1))));

            if (getElementValue(elements.floorCareCheckbox)) { costMin += state.areaSqFt * pricing.addOns.floorCare.min; costMax += state.areaSqFt * pricing.addOns.floorCare.max; }
            if (getElementValue(elements.windowCleaningCheckbox)) { costMin += state.areaSqFt * pricing.addOns.windowCleaning.min; costMax += state.areaSqFt * pricing.addOns.windowCleaning.max; }
            if (getElementValue(elements.trashRemovalCheckbox)) { costMin += pricing.addOns.trashRemoval.min; costMax += pricing.addOns.trashRemoval.max; }
            if (getElementValue(elements.suppliesProvidedCheckbox)) { costMin += state.areaSqFt * pricing.addOns.suppliesProvided.min; costMax += state.areaSqFt * pricing.addOns.suppliesProvided.max; }

            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const elements = this.elements;
            elements.propertyTypeSelect.addEventListener('change', calculateOverallCost);
            elements.areaSqFtInput.addEventListener('input', calculateOverallCost);
            elements.serviceFrequencySelect.addEventListener('change', calculateOverallCost);
            elements.floorCareCheckbox.addEventListener('change', calculateOverallCost);
            elements.windowCleaningCheckbox.addEventListener('change', calculateOverallCost);
            elements.trashRemovalCheckbox.addEventListener('change', calculateOverallCost);
            elements.suppliesProvidedCheckbox.addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() { /* No specific dynamic visibility beyond default */ }
    },
    'flooring': {
        state: { areaSqFt: 200, numStairs: 1 },
        pricing: {
            materials: { // Cost per sq.ft for installation
                'hardwood': { min: 8, max: 20, refinishMin: 3, refinishMax: 6 },
                'laminate': { min: 4, max: 8 }, 'vinyl': { min: 3, max: 7 }, 'tile': { min: 7, max: 18 }, 'carpet': { min: 2, max: 5 }
            },
            serviceTypeAdjustments: { 'installation': { min: 1.0, max: 1.0 }, 'repair': { min: 1.5, max: 3.0 }, 'refinishing': { min: 1.0, max: 1.0 }, 'removalDisposal': { min: 0.5, max: 1.5 } },
            subfloorConditionMultipliers: { 'good': { min: 1.0, max: 1.0 }, 'minorPrep': { min: 1.1, max: 1.3 }, 'majorPrep': { min: 1.4, max: 1.8 } },
            addOns: { baseboard: { min: 5, max: 15 }, furnitureMoving: { min: 100, max: 300 }, stairInstallation: { min: 40, max: 100 } },
            minimumJobFee: { min: 250, max: 500 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing; const elements = this.elements;
            const serviceType = getElementValue(elements.serviceTypeSelect);
            const materialType = getElementValue(elements.materialTypeSelect);
            state.areaSqFt = getElementValue(elements.areaSqFtInput);
            const subfloorCondition = getElementValue(elements.subfloorConditionSelect);
            state.numStairs = parseFloat(elements.numStairsValueSpan.textContent) || 0;

            let baseMin = 0; let baseMax = 0;
            if (serviceType === 'installation') { baseMin = state.areaSqFt * pricing.materials[materialType].min; baseMax = state.areaSqFt * pricing.materials[materialType].max; }
            else if (serviceType === 'refinishing' && materialType === 'hardwood') { baseMin = state.areaSqFt * pricing.materials.hardwood.refinishMin; baseMax = state.areaSqFt * pricing.materials.hardwood.refinishMax; }
            else if (serviceType === 'removalDisposal') { baseMin = state.areaSqFt * pricing.serviceTypeAdjustments.removalDisposal.min; baseMax = state.areaSqFt * pricing.serviceTypeAdjustments.removalDisposal.max; }
            else if (serviceType === 'repair') { baseMin = 150; baseMax = 400; }
            costMin += baseMin; costMax += baseMax;

            if (serviceType === 'installation' || serviceType === 'refinishing') {
                costMin *= pricing.subfloorConditionMultipliers[subfloorCondition].min; costMax *= pricing.subfloorConditionMultipliers[subfloorCondition].max;
            }

            if (getElementValue(elements.baseboardInstallationCheckbox)) { costMin += state.areaSqFt * 0.5 * pricing.addOns.baseboard.min; costMax += state.areaSqFt * 0.5 * pricing.addOns.baseboard.max; }
            if (getElementValue(elements.furnitureMovingCheckbox)) { costMin += pricing.addOns.furnitureMoving.min; costMax += pricing.addOns.furnitureMoving.max; }
            if (getElementValue(elements.stairInstallationCheckbox)) { costMin += state.numStairs * pricing.addOns.stairInstallation.min; costMax += state.numStairs * pricing.addOns.stairInstallation.max; }
            
            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const elements = this.elements;
            elements.serviceTypeSelect.addEventListener('change', this.initDisplay);
            elements.materialTypeSelect.addEventListener('change', calculateOverallCost);
            elements.areaSqFtInput.addEventListener('input', calculateOverallCost);
            elements.subfloorConditionSelect.addEventListener('change', calculateOverallCost);
            elements.baseboardInstallationCheckbox.addEventListener('change', calculateOverallCost);
            elements.furnitureMovingCheckbox.addEventListener('change', calculateOverallCost);
            setupAddonVisibility('flooringStairInstallation', 'flooringStairInstallationInputs', 'flooringNumStairsValue');
        },
        initDisplay: function() {
            const elements = this.elements;
            elements.stairInstallationInputsDiv.classList.toggle('hidden', !getElementValue(elements.stairInstallationCheckbox));
        }
    },
    'dog-walking': {
        state: { numDogs: 1 },
        pricing: {
            baseRatesPerWalk: { '15': { min: 15, max: 25 }, '30': { min: 20, max: 35 }, '45': { min: 25, max: 45 }, '60': { min: 30, max: 55 } },
            frequencyDiscounts: { 'oneTime': { min: 1.0, max: 1.0, numWalks: 1 }, 'daily': { min: 0.8, max: 0.9, numWalks: 20 }, 'weekly': { min: 0.9, max: 1.0, numWalks: 3 }, 'monthly': { min: 0.75, max: 0.85, numWalks: 15 } },
            perAdditionalDog: { min: 5, max: 10 },
            addOns: { weekendHoliday: { min: 5, max: 15 }, additionalServices: { min: 10, max: 25 }, puppySeniorSurcharge: { min: 5, max: 10 } },
            minimumCharge: { min: 20, max: 30 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing; const elements = this.elements;
            state.numDogs = parseFloat(elements.numDogsValueSpan.textContent) || 0;
            const duration = getElementValue(elements.durationSelect);
            const frequency = getElementValue(elements.frequencySelect);

            let baseWalkMin = pricing.baseRatesPerWalk[duration].min;
            let baseWalkMax = pricing.baseRatesPerWalk[duration].max;

            if (state.numDogs > 1) { baseWalkMin += (state.numDogs - 1) * pricing.perAdditionalDog.min; baseWalkMax += (state.numDogs - 1) * pricing.perAdditionalDog.max; }

            if (frequency === 'oneTime') { costMin += baseWalkMin; costMax += baseWalkMax; }
            else {
                const freqAdj = pricing.frequencyDiscounts[frequency];
                costMin += (baseWalkMin * freqAdj.numWalks) * freqAdj.min;
                costMax += (baseWalkMax * freqAdj.numWalks) * freqAdj.max;
            }
            
            if (getElementValue(elements.weekendHolidayCheckbox)) { costMin += pricing.addOns.weekendHoliday.min; costMax += pricing.addOns.weekendHoliday.max; }
            if (getElementValue(elements.additionalServicesCheckbox)) { costMin += pricing.addOns.additionalServices.min; costMax += pricing.addOns.additionalServices.max; }
            if (getElementValue(elements.puppySeniorCareCheckbox)) { costMin += pricing.addOns.puppySeniorSurcharge.min; costMax += pricing.addOns.puppySeniorSurcharge.max; }

            costMin = Math.max(costMin, pricing.minimumCharge.min); costMax = Math.max(costMax, pricing.minimumCharge.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const elements = this.elements;
            elements.durationSelect.addEventListener('change', calculateOverallCost);
            elements.frequencySelect.addEventListener('change', calculateOverallCost);
            elements.weekendHolidayCheckbox.addEventListener('change', calculateOverallCost);
            elements.additionalServicesCheckbox.addEventListener('change', calculateOverallCost);
            elements.puppySeniorCareCheckbox.addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() { /* No specific dynamic visibility beyond default */ }
    },
    'appliance-repair': {
        state: {},
        pricing: {
            diagnosticFee: { min: 75, max: 150 },
            applianceTypeBase: {
                'refrigerator': { min: 150, max: 400 }, 'washer': { min: 100, max: 300 }, 'dryer': { min: 100, max: 300 },
                'dishwasher': { min: 120, max: 350 }, 'ovenStove': { min: 150, max: 450 }, 'microwave': { min: 80, max: 200 },
                'other': { min: 100, max: 300 }
            },
            issueSeverityMultipliers: { 'minor': { min: 0.8, max: 1.0 }, 'moderate': { min: 1.0, max: 1.5 }, 'major': { min: 1.5, max: 2.5 } },
            urgencySurcharges: { 'standard': { min: 0, max: 0 }, 'urgent': { min: 50, max: 100 }, 'emergency': { min: 100, max: 250 } },
            addOns: { partsNeeded: { min: 50, max: 300 } },
            minimumJobFee: { min: 120, max: 200 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const pricing = this.pricing; const elements = this.elements;
            const applianceType = getElementValue(elements.applianceTypeSelect);
            const issueSeverity = getElementValue(elements.issueSeveritySelect);
            const repairUrgency = getElementValue(elements.repairUrgencySelect);
            const partsNeeded = getElementValue(elements.partsNeededCheckbox);
            const diagnosticFeeIncluded = getElementValue(elements.diagnosticFeeCheckbox);

            if (diagnosticFeeIncluded) { costMin += pricing.diagnosticFee.min; costMax += pricing.diagnosticFee.max; }

            let baseRepairMin = pricing.applianceTypeBase[applianceType].min;
            let baseRepairMax = pricing.applianceTypeBase[applianceType].max;

            baseRepairMin *= pricing.issueSeverityMultipliers[issueSeverity].min;
            baseRepairMax *= pricing.issueSeverityMultipliers[issueSeverity].max;

            costMin += baseRepairMin; costMax += baseRepairMax;

            costMin += pricing.urgencySurcharges[repairUrgency].min;
            costMax += pricing.urgencySurcharges[repairUrgency].max;

            if (partsNeeded) { costMin += pricing.addOns.partsNeeded.min; costMax += pricing.addOns.partsNeeded.max; }
            
            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const elements = this.elements;
            elements.applianceTypeSelect.addEventListener('change', calculateOverallCost);
            elements.issueSeveritySelect.addEventListener('change', calculateOverallCost);
            elements.repairUrgencySelect.addEventListener('change', calculateOverallCost);
            elements.partsNeededCheckbox.addEventListener('change', calculateOverallCost);
            elements.diagnosticFeeCheckbox.addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() { /* No specific dynamic visibility beyond default */ }
    },
    'chimney-sweep': {
        state: { numFlues: 1, repairHours: 1 },
        pricing: {
            serviceTypeRates: {
                'inspection': { min: 80, max: 150 }, 'sweep': { min: 150, max: 300 }, 'inspectionSweep': { min: 200, max: 400 },
                'level2Inspection': { min: 250, max: 500 }, 'repair': { min: 0, max: 0 }
            },
            perFlueMultiplier: { min: 50, max: 100 },
            chimneyTypeAdjustments: { 'standard': { min: 1.0, max: 1.0 }, 'prefab': { min: 0.9, max: 1.1 }, 'woodStove': { min: 1.1, max: 1.3 } },
            hourlyRate: { min: 75, max: 120 },
            addOns: { creosoteRemoval: { min: 100, max: 250 }, capInstallation: { min: 150, max: 300 }, waterproofing: { min: 200, max: 500 } },
            minimumJobFee: { min: 100, max: 200 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing; const elements = this.elements;
            const serviceType = getElementValue(elements.serviceTypeSelect);
            const chimneyType = getElementValue(elements.chimneyTypeSelect);
            state.numFlues = parseFloat(elements.numFluesValueSpan.textContent) || 0;
            state.repairHours = getElementValue(elements.repairHoursInput);

            let baseMin = 0; let baseMax = 0;

            if (serviceType === 'repair') { baseMin = state.repairHours * pricing.hourlyRate.min; baseMax = state.repairHours * pricing.hourlyRate.max; }
            else {
                baseMin = pricing.serviceTypeRates[serviceType].min; baseMax = pricing.serviceTypeRates[serviceType].max;
                if (state.numFlues > 1) { baseMin += (state.numFlues - 1) * pricing.perFlueMultiplier.min; baseMax += (state.numFlues - 1) * pricing.perFlueMultiplier.max; }
                baseMin *= pricing.chimneyTypeAdjustments[chimneyType].min; baseMax *= pricing.chimneyTypeAdjustments[chimneyType].max;
            }
            costMin += baseMin; costMax += baseMax;
            
            if (getElementValue(elements.creosoteRemovalCheckbox)) { costMin += pricing.addOns.creosoteRemoval.min; costMax += pricing.addOns.creosoteRemoval.max; }
            if (getElementValue(elements.capInstallationCheckbox)) { costMin += pricing.addOns.capInstallation.min; costMax += pricing.addOns.capInstallation.max; }
            if (getElementValue(elements.waterproofingCheckbox)) { costMin += pricing.addOns.waterproofing.min; costMax += pricing.addOns.waterproofing.max; }

            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const elements = this.elements;
            elements.serviceTypeSelect.addEventListener('change', this.initDisplay);
            elements.chimneyTypeSelect.addEventListener('change', calculateOverallCost);
            elements.repairHoursInput.addEventListener('input', calculateOverallCost);
            elements.creosoteRemovalCheckbox.addEventListener('change', calculateOverallCost);
            elements.capInstallationCheckbox.addEventListener('change', calculateOverallCost);
            elements.waterproofingCheckbox.addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const elements = this.elements;
            const serviceType = getElementValue(elements.serviceTypeSelect);
            if (serviceType === 'repair') { elements.repairHoursGroup.classList.remove('hidden'); }
            else { elements.repairHoursGroup.classList.add('hidden'); }
        }
    },
    'carpet-cleaning': {
        state: { numRooms: 1, areaSqFt: 200, numStairs: 1 },
        pricing: {
            baseRatesPerRoom: { 'steam': { min: 50, max: 80 }, 'dry': { min: 40, max: 70 }, 'shampoo': { min: 30, max: 60 } },
            baseRatesPerSqFt: { 'steam': { min: 0.25, max: 0.50 }, 'dry': { min: 0.20, max: 0.45 }, 'shampoo': { min: 0.15, max: 0.35 } },
            conditionMultipliers: { 'light': { min: 1.0, max: 1.0 }, 'medium': { min: 1.2, max: 1.4 }, 'heavy': { min: 1.5, max: 2.0 } },
            addOns: { spotTreatment: { min: 25, max: 75 }, deodorizing: { min: 20, max: 50 }, protector: { min: 0.10, max: 0.20 }, stairCleaning: { min: 5, max: 15 } },
            minimumJobFee: { min: 100, max: 200 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing; const elements = this.elements;
            const method = getElementValue(elements.methodSelect);
            const areaType = getElementValue(elements.areaTypeSelect);
            state.numRooms = parseFloat(elements.numRoomsValueSpan.textContent) || 0;
            state.areaSqFt = getElementValue(elements.areaSqFtInput);
            const condition = getElementValue(elements.conditionSelect);
            state.numStairs = parseFloat(elements.numStairsValueSpan.textContent) || 0;

            let baseMin = 0; let baseMax = 0;
            if (areaType === 'perRoom') { baseMin = state.numRooms * pricing.baseRatesPerRoom[method].min; baseMax = state.numRooms * pricing.baseRatesPerRoom[method].max; }
            else { baseMin = state.areaSqFt * pricing.baseRatesPerSqFt[method].min; baseMax = state.areaSqFt * pricing.baseRatesPerSqFt[method].max; }
            
            baseMin *= pricing.conditionMultipliers[condition].min; baseMax *= pricing.conditionMultipliers[condition].max;
            costMin += baseMin; costMax += baseMax;
            
            if (getElementValue(elements.spotTreatmentCheckbox)) { costMin += pricing.addOns.spotTreatment.min; costMax += pricing.addOns.spotTreatment.max; }
            if (getElementValue(elements.deodorizingCheckbox)) { costMin += pricing.addOns.deodorizing.min; costMax += pricing.addOns.deodorizing.max; }
            if (getElementValue(elements.protectorCheckbox)) { costMin += state.areaSqFt * pricing.addOns.protector.min; costMax += state.areaSqFt * pricing.addOns.protector.max; }
            if (getElementValue(elements.stairCleaningCheckbox)) { costMin += state.numStairs * pricing.addOns.stairCleaning.min; costMax += state.numStairs * pricing.addOns.stairCleaning.max; }
            
            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const elements = this.elements;
            elements.areaTypeSelect.addEventListener('change', this.initDisplay);
            elements.methodSelect.addEventListener('change', calculateOverallCost);
            elements.areaSqFtInput.addEventListener('input', calculateOverallCost);
            elements.conditionSelect.addEventListener('change', calculateOverallCost);
            elements.spotTreatmentCheckbox.addEventListener('change', calculateOverallCost);
            elements.deodorizingCheckbox.addEventListener('change', calculateOverallCost);
            elements.protectorCheckbox.addEventListener('change', calculateOverallCost);
            setupAddonVisibility('carpetStairCleaning', 'carpetStairCleaningInputs', 'carpetCleaningNumStairsValue');
        },
        initDisplay: function() {
            const elements = this.elements;
            const areaType = getElementValue(elements.areaTypeSelect);
            if (areaType === 'perRoom') { elements.numRoomsGroup.classList.remove('hidden'); elements.areaSqFtGroup.classList.add('hidden'); }
            else { elements.numRoomsGroup.classList.add('hidden'); elements.areaSqFtGroup.classList.remove('hidden'); }

            elements.stairCleaningInputsDiv.classList.toggle('hidden', !getElementValue(elements.stairCleaningCheckbox));
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
            materialQualityMultipliers: { 'standard': { min: 1.0, max: 1.0 }, 'premium': { min: 1.2, max: 1.5 }, 'reclaimed': { min: 1.5, max: 2.0 } },
            addOns: { demolitionRemoval: { min: 100, max: 300 }, finishingStaining: { min: 50, max: 200 }, permitAssistance: { min: 75, max: 150 } },
            minimumJobFee: { min: 150, max: 300 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing; const elements = this.elements;
            const projectType = getElementValue(elements.projectTypeSelect);
            state.estimatedHours = getElementValue(elements.estimatedHoursInput);
            const complexity = getElementValue(elements.complexitySelect);
            const materialQuality = getElementValue(elements.materialQualitySelect);

            let baseMinHours = state.estimatedHours; let baseMaxHours = state.estimatedHours;

            if (projectType !== 'other') {
                baseMinHours = pricing.projectTypeBaseHours[projectType].min;
                baseMaxHours = pricing.projectTypeBaseHours[projectType].max;
            }

            costMin += baseMinHours * pricing.hourlyRate.min;
            costMax += baseMaxHours * pricing.hourlyRate.max;

            costMin *= pricing.complexityMultipliers[complexity].min; costMax *= pricing.complexityMultipliers[complexity].max;
            costMin *= pricing.materialQualityMultipliers[materialQuality].min; costMax *= pricing.materialQualityMultipliers[materialQuality].max;

            if (getElementValue(elements.demolitionRemovalCheckbox)) { costMin += pricing.addOns.demolitionRemoval.min; costMax += pricing.addOns.demolitionRemoval.max; }
            if (getElementValue(elements.finishingStainingCheckbox)) { costMin += pricing.addOns.finishingStaining.min; costMax += pricing.addOns.finishingStaining.max; }
            if (getElementValue(elements.permitAssistanceCheckbox)) { costMin += pricing.addOns.permitAssistance.min; costMax += pricing.addOns.permitAssistance.max; }
            
            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const elements = this.elements;
            elements.projectTypeSelect.addEventListener('change', this.initDisplay);
            elements.estimatedHoursInput.addEventListener('input', calculateOverallCost);
            elements.complexitySelect.addEventListener('change', calculateOverallCost);
            elements.materialQualitySelect.addEventListener('change', calculateOverallCost);
            elements.demolitionRemovalCheckbox.addEventListener('change', calculateOverallCost);
            elements.finishingStainingCheckbox.addEventListener('change', calculateOverallCost);
            elements.permitAssistanceCheckbox.addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const elements = this.elements;
            const projectType = getElementValue(elements.projectTypeSelect);
            if (projectType === 'other') { elements.estimatedHoursGroup.classList.remove('hidden'); }
            else { elements.estimatedHoursGroup.classList.add('hidden'); }
        }
    },
    'garage-services': {
        state: {},
        pricing: {
            serviceTypeRates: {
                'doorRepair': { min: 150, max: 400 }, 'openerRepair': { min: 100, max: 350 },
                'newDoorInstall': { min: 500, max: 1500 },
                'newOpenerInstall': { min: 250, max: 600 },
                'maintenance': { min: 80, max: 150 }
            },
            doorTypeAdjustments: { 'single': { min: 1.0, max: 1.0 }, 'double': { min: 1.5, max: 2.0 }, 'custom': { min: 2.0, max: 3.0 } },
            materialMultipliers: { 'steel': { min: 1.0, max: 1.0 }, 'wood': { min: 1.5, max: 2.5 }, 'aluminum': { min: 1.2, max: 1.8 }, 'fiberglass': { min: 1.1, max: 1.5 } },
            repairSeverityMultipliers: { 'minor': { min: 0.8, max: 1.0 }, 'moderate': { min: 1.2, max: 1.5 }, 'major': { min: 1.5, max: 2.0 } },
            addOns: { oldDoorRemoval: { min: 100, max: 250 }, keypadRemote: { min: 50, max: 100 }, smartOpener: { min: 75, max: 200 } },
            minimumJobFee: { min: 100, max: 200 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const pricing = this.pricing; const elements = this.elements;
            const serviceType = getElementValue(elements.serviceTypeSelect);
            const doorType = getElementValue(elements.doorTypeSelect);
            const materialType = getElementValue(elements.materialTypeSelect);
            const repairSeverity = getElementValue(elements.repairSeveritySelect);

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

            if (getElementValue(elements.oldDoorRemovalCheckbox)) { costMin += pricing.addOns.oldDoorRemoval.min; costMax += pricing.addOns.oldDoorRemoval.max; }
            if (getElementValue(elements.keypadRemoteCheckbox)) { costMin += pricing.addOns.keypadRemote.min; costMax += pricing.addOns.keypadRemote.max; }
            if (getElementValue(elements.smartOpenerCheckbox)) { costMin += pricing.addOns.smartOpener.min; costMax += pricing.addOns.smartOpener.max; }

            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const elements = this.elements;
            elements.serviceTypeSelect.addEventListener('change', this.initDisplay);
            elements.doorTypeSelect.addEventListener('change', calculateOverallCost);
            elements.materialTypeSelect.addEventListener('change', calculateOverallCost);
            elements.repairSeveritySelect.addEventListener('change', calculateOverallCost);
            elements.oldDoorRemovalCheckbox.addEventListener('change', calculateOverallCost);
            elements.keypadRemoteCheckbox.addEventListener('change', calculateOverallCost);
            elements.smartOpenerCheckbox.addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const elements = this.elements;
            const serviceType = getElementValue(elements.serviceTypeSelect);
            
            if (serviceType === 'doorRepair' || serviceType === 'openerRepair') {
                elements.repairSeverityGroup.classList.remove('hidden');
            } else {
                elements.repairSeverityGroup.classList.add('hidden');
            }

            if (serviceType === 'newDoorInstall') {
                elements.doorTypeSelect.closest('.rg-form-group').classList.remove('hidden');
                elements.materialTypeSelect.closest('.rg-form-group').classList.remove('hidden');
            } else {
                elements.doorTypeSelect.closest('.rg-form-group').classList.add('hidden');
                elements.materialTypeSelect.closest('.rg-form-group').classList.add('hidden');
            }
        }
    },
    'professional': {
        state: { estimatedHours: 4 },
        pricing: {
            hourlyRateBase: { min: 75, max: 150 },
            serviceTypeAdjustments: {
                'homeOrganizing': { min: 1.0, max: 1.2 }, 'designConsultation': { min: 1.2, max: 1.5 },
                'staging': { min: 1.3, max: 1.6 }, 'personalAssistant': { min: 0.8, max: 1.0 },
                'generalConsulting': { min: 1.0, max: 1.2 }
            },
            expertiseLevelMultipliers: { 'standard': { min: 1.0, max: 1.0 }, 'specialist': { min: 1.3, max: 1.6 }, 'premium': { min: 1.7, max: 2.2 } },
            addOns: { travelFee: { min: 50, max: 200 }, materialSourcing: { min: 0.10, max: 0.20 }, followUp: { min: 75, max: 150 } },
            minimumJobFee: { min: 200, max: 400 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing; const elements = this.elements;
            const serviceType = getElementValue(elements.serviceTypeSelect);
            state.estimatedHours = getElementValue(elements.estimatedHoursInput);
            const expertiseLevel = getElementValue(elements.expertiseLevelSelect);

            let baseMin = state.estimatedHours * pricing.hourlyRateBase.min;
            let baseMax = state.estimatedHours * pricing.hourlyRateBase.max;

            baseMin *= pricing.serviceTypeAdjustments[serviceType].min;
            baseMax *= pricing.serviceTypeAdjustments[serviceType].max;
            baseMin *= pricing.expertiseLevelMultipliers[expertiseLevel].min;
            baseMax *= pricing.expertiseLevelMultipliers[expertiseLevel].max;

            costMin += baseMin; costMax += baseMax;

            if (getElementValue(elements.travelFeeCheckbox)) { costMin += pricing.addOns.travelFee.min; costMax += pricing.addOns.travelFee.max; }
            if (getElementValue(elements.materialSourcingCheckbox)) { costMin += pricing.addOns.materialSourcing.min * costMin; costMax += pricing.addOns.materialSourcing.max * costMax; }
            if (getElementValue(elements.followUpCheckbox)) { costMin += pricing.addOns.followUp.min; costMax += pricing.addOns.followUp.max; }

            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const elements = this.elements;
            elements.serviceTypeSelect.addEventListener('change', calculateOverallCost);
            elements.estimatedHoursInput.addEventListener('input', calculateOverallCost);
            elements.expertiseLevelSelect.addEventListener('change', calculateOverallCost);
            elements.travelFeeCheckbox.addEventListener('change', calculateOverallCost);
            elements.materialSourcingCheckbox.addEventListener('change', calculateOverallCost);
            elements.followUpCheckbox.addEventListener('change', calculateOverallCost);
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
                'emergencyRemoval': { min: 500, max: 5000 }
            },
            accessibilityMultipliers: { 'easy': { min: 1.0, max: 1.0 }, 'moderate': { min: 1.2, max: 1.5 }, 'difficult': { min: 1.5, max: 2.5 } },
            conditionMultipliers: { 'healthy': { min: 1.0, max: 1.0 }, 'diseasedDead': { min: 1.2, max: 1.5 } },
            addOns: { debrisRemoval: { min: 150, max: 400 }, limbingChipping: { min: 100, max: 300 }, permitAssistance: { min: 50, max: 150 } },
            minimumJobFee: { min: 250, max: 500 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing; const elements = this.elements;
            const serviceType = getElementValue(elements.serviceTypeSelect);
            state.numTreesStumps = parseFloat(elements.numTreesStumpsValueSpan.textContent) || 0;
            const accessibility = getElementValue(elements.accessibilitySelect);
            const condition = getElementValue(elements.conditionSelect);

            let baseMin = pricing.serviceTypeRates[serviceType].min;
            let baseMax = pricing.serviceTypeRates[serviceType].max;

            if (serviceType.startsWith('removal') || serviceType === 'stumpGrinding') {
                baseMin *= state.numTreesStumps; baseMax *= state.numTreesStumps;
            }

            baseMin *= pricing.accessibilityMultipliers[accessibility].min; baseMax *= pricing.accessibilityMultipliers[accessibility].max;
            baseMin *= pricing.conditionMultipliers[condition].min; baseMax *= pricing.conditionMultipliers[condition].max;
            
            costMin += baseMin; costMax += baseMax;

            if (getElementValue(elements.debrisRemovalCheckbox)) { costMin += pricing.addOns.debrisRemoval.min; costMax += pricing.addOns.debrisRemoval.max; }
            if (getElementValue(elements.limbingBranchChippingCheckbox)) { costMin += pricing.addOns.limbingChipping.min; costMax += pricing.addOns.limbingChipping.max; }
            if (getElementValue(elements.permitAssistanceCheckbox)) { costMin += pricing.addOns.permitAssistance.min; costMax += pricing.addOns.permitAssistance.max; }

            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const elements = this.elements;
            elements.serviceTypeSelect.addEventListener('change', calculateOverallCost);
            elements.accessibilitySelect.addEventListener('change', calculateOverallCost);
            elements.conditionSelect.addEventListener('change', calculateOverallCost);
            elements.debrisRemovalCheckbox.addEventListener('change', calculateOverallCost);
            elements.limbingBranchChippingCheckbox.addEventListener('change', calculateOverallCost);
            elements.permitAssistanceCheckbox.addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() { /* No specific dynamic visibility beyond default */ }
    },
    'locksmith-services': {
        state: { numLocks: 1, repairHours: 1, numKeys: 1 },
        pricing: {
            serviceTypeRates: {
                'rekey': { min: 80, max: 150 }, 'lockReplace': { min: 100, max: 250 }, 'newInstall': { min: 150, max: 300 },
                'emergencyLockout': { min: 100, max: 300 }, 'keyDuplication': { min: 5, max: 20 }, 'otherRepair': { min: 0, max: 0 }
            },
            hourlyRate: { min: 75, max: 120 },
            lockQualityMultipliers: { 'standard': { min: 1.0, max: 1.0 }, 'highSecurity': { min: 1.5, max: 2.5 }, 'commercial': { min: 1.8, max: 3.0 } },
            addOns: { brokenKeyExtraction: { min: 75, max: 150 }, securityAudit: { min: 100, max: 300 } },
            minimumJobFee: { min: 80, max: 150 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing; const elements = this.elements;
            const serviceType = getElementValue(elements.serviceTypeSelect);
            state.numLocks = parseFloat(elements.numLocksValueSpan.textContent) || 0;
            state.repairHours = getElementValue(elements.repairHoursInput);
            state.numKeys = parseFloat(elements.numKeysValueSpan.textContent) || 0;
            const lockQuality = getElementValue(elements.lockQualitySelect);

            let baseMin = 0; let baseMax = 0;
            if (serviceType === 'otherRepair') { baseMin = state.repairHours * pricing.hourlyRate.min; baseMax = state.repairHours * pricing.hourlyRate.max; }
            else if (serviceType === 'keyDuplication') { baseMin = state.numKeys * pricing.serviceTypeRates.keyDuplication.min; baseMax = state.numKeys * pricing.serviceTypeRates.keyDuplication.max; }
            else {
                baseMin = pricing.serviceTypeRates[serviceType].min * state.numLocks;
                baseMax = pricing.serviceTypeRates[serviceType].max * state.numLocks;
            }
            if (serviceType !== 'keyDuplication' && serviceType !== 'emergencyLockout' && serviceType !== 'otherRepair') {
                baseMin *= pricing.lockQualityMultipliers[lockQuality].min; baseMax *= pricing.lockQualityMultipliers[lockQuality].max;
            }
            
            costMin += baseMin; costMax += baseMax;

            if (getElementValue(elements.keyExtraCopiesCheckbox)) { costMin += state.numKeys * pricing.serviceTypeRates.keyDuplication.min; costMax += state.numKeys * pricing.serviceTypeRates.keyDuplication.max; } // Reusing duplication rate
            if (getElementValue(elements.brokenKeyExtractionCheckbox)) { costMin += pricing.addOns.brokenKeyExtraction.min; costMax += pricing.addOns.brokenKeyExtraction.max; }
            if (getElementValue(elements.securityAuditCheckbox)) { costMin += pricing.addOns.securityAudit.min; costMax += pricing.addOns.securityAudit.max; }
            
            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const elements = this.elements;
            elements.serviceTypeSelect.addEventListener('change', this.initDisplay);
            elements.lockQualitySelect.addEventListener('change', calculateOverallCost);
            setupAddonVisibility('locksmithKeyExtraCopies', 'locksmithKeyExtraCopiesInputs', 'locksmithNumKeysValue');
            elements.brokenKeyExtractionCheckbox.addEventListener('change', calculateOverallCost);
            elements.securityAuditCheckbox.addEventListener('change', calculateOverallCost);
            elements.repairHoursInput.addEventListener('input', calculateOverallCost);
        },
        initDisplay: function() {
            const elements = this.elements;
            const serviceType = getElementValue(elements.serviceTypeSelect);
            
            if (serviceType === 'otherRepair') { elements.numLocksGroup.classList.add('hidden'); elements.repairHoursGroup.classList.remove('hidden'); }
            else if (serviceType === 'keyDuplication' || serviceType === 'emergencyLockout') { elements.numLocksGroup.classList.add('hidden'); elements.repairHoursGroup.classList.add('hidden'); }
            else { elements.numLocksGroup.classList.remove('hidden'); elements.repairHoursGroup.classList.add('hidden'); }
            elements.keyExtraCopiesInputsDiv.classList.toggle('hidden', !getElementValue(elements.keyExtraCopiesCheckbox)); // Ensure addon visibility
        }
    },
    'pet-services': {
        state: { duration: 1 },
        pricing: {
            groomingRates: {
                'dog': { 'small': { min: 50, max: 80 }, 'medium': { min: 70, max: 100 }, 'large': { min: 90, max: 150 }, 'xLarge': { min: 120, max: 200 } },
                'cat': { 'small': { min: 60, max: 100 }, 'medium': { min: 80, max: 120 }, 'large': { min: 100, max: 150 } },
                'otherSmall': { min: 30, max: 70 }
            },
            groomingPackages: { 'basic': { min: 1.0, max: 1.0 }, 'full': { min: 1.2, max: 1.5 }, 'premium': { min: 1.5, max: 2.0 } },
            petSittingRates: { min: 40, max: 70 },
            boardingRates: { min: 30, max: 60 },
            daycareRates: { min: 25, max: 45 },
            addOns: { specialNeeds: { min: 10, max: 30 }, extraPlayTime: { min: 15, max: 35 }, transportation: { min: 30, max: 75 } },
            minimumJobFee: { min: 50, max: 100 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing; const elements = this.elements;
            const serviceType = getElementValue(elements.serviceTypeSelect);
            const petType = getElementValue(elements.petTypeSelect);
            const petSize = getElementValue(elements.petSizeSelect);
            const groomingPackage = getElementValue(elements.groomingPackageSelect);
            state.duration = parseFloat(elements.durationValueSpan.textContent) || 0;

            let baseMin = 0; let baseMax = 0;

            if (serviceType === 'grooming') {
                const typeRates = pricing.groomingRates[petType];
                if (petType === 'dog' || petType === 'cat') { baseMin = typeRates[petSize].min; baseMax = typeRates[petSize].max; }
                else { baseMin = typeRates.min; baseMax = typeRates.max; }
                baseMin *= pricing.groomingPackages[groomingPackage].min;
                baseMax *= pricing.groomingPackages[groomingPackage].max;
            } else if (serviceType === 'petSitting') {
                baseMin = state.duration * pricing.petSittingRates.min; baseMax = state.duration * pricing.petSittingRates.max;
            } else if (serviceType === 'boarding') {
                baseMin = state.duration * pricing.boardingRates.min; baseMax = state.duration * pricing.boardingRates.max;
            } else if (serviceType === 'daycare') {
                baseMin = pricing.daycareRates.min; baseMax = pricing.daycareRates.max;
            }
            costMin += baseMin; costMax += baseMax;

            if (getElementValue(elements.specialNeedsCheckbox)) { costMin += pricing.addOns.specialNeeds.min; costMax += pricing.addOns.specialNeeds.max; }
            if (getElementValue(elements.extraPlayTimeCheckbox)) { costMin += pricing.addOns.extraPlayTime.min; costMax += pricing.addOns.extraPlayTime.max; }
            if (getElementValue(elements.transportationCheckbox)) { costMin += pricing.addOns.transportation.min; costMax += pricing.addOns.transportation.max; }
            
            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const elements = this.elements;
            elements.serviceTypeSelect.addEventListener('change', this.initDisplay);
            elements.petTypeSelect.addEventListener('change', this.initDisplay); // Changing pet type might show/hide size
            elements.petSizeSelect.addEventListener('change', calculateOverallCost);
            elements.groomingPackageSelect.addEventListener('change', calculateOverallCost);
            setupAddonVisibility('petSittingBoardingDurationGroup', 'petSittingBoardingDurationInputs', 'petSittingBoardingDurationValue'); // Duration group
            document.getElementById('petSittingBoardingDurationValue').addEventListener('input', calculateOverallCost); // Ensure manual input updates
            elements.specialNeedsCheckbox.addEventListener('change', calculateOverallCost);
            elements.extraPlayTimeCheckbox.addEventListener('change', calculateOverallCost);
            elements.transportationCheckbox.addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const elements = this.elements;
            const serviceType = getElementValue(elements.serviceTypeSelect);
            const petType = getElementValue(elements.petTypeSelect);
            
            elements.groomingPackageGroup.classList.toggle('hidden', serviceType !== 'grooming');
            elements.petSittingBoardingDurationGroup.classList.toggle('hidden', serviceType !== 'petSitting' && serviceType !== 'boarding');
            elements.petSizeSelect.closest('.rg-form-group').classList.toggle('hidden', petType === 'otherSmall'); // Toggle pet size based on pet type (only for dog/cat)
        }
    },
    'landscaping-services': {
        state: { areaSqFt: 500, estimatedHours: 8, retainingWallLength: 10 },
        pricing: {
            projectTypeRates: {
                'newDesignInstall': { min: 5, max: 15 }, 'renovation': { min: 3, max: 10 },
                'gardenBedInstall': { min: 200, max: 800 }, 'hardscapingInstall': { min: 10, max: 40 },
                'irrigationInstall': { min: 1500, max: 4000 }, 'otherCustom': { min: 0, max: 0 }
            },
            hourlyRate: { min: 70, max: 120 },
            designComplexityMultipliers: { 'simple': { min: 1.0, max: 1.0 }, 'moderate': { min: 1.3, max: 1.6 }, 'complex': { min: 1.7, max: 2.2 } },
            addOns: { planting: { min: 1.0, max: 3.0 }, lighting: { min: 500, max: 1500 }, waterFeature: { min: 800, max: 3000 }, retainingWallPerFt: { min: 40, max: 100 } },
            minimumJobFee: { min: 500, max: 1500 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing; const elements = this.elements;
            const projectType = getElementValue(elements.projectTypeSelect);
            state.areaSqFt = getElementValue(elements.areaSqFtInput);
            state.estimatedHours = getElementValue(elements.estimatedHoursInput);
            const designComplexity = getElementValue(elements.designComplexitySelect);
            state.retainingWallLength = getElementValue(elements.retainingWallLengthInput);

            let baseMin = 0; let baseMax = 0;
            if (projectType === 'otherCustom') { baseMin = state.estimatedHours * pricing.hourlyRate.min; baseMax = state.estimatedHours * pricing.hourlyRate.max; }
            else if (projectType === 'gardenBedInstall' || projectType === 'irrigationInstall') {
                baseMin = pricing.projectTypeRates[projectType].min; baseMax = pricing.projectTypeRates[projectType].max;
            } else { // Per sq.ft
                baseMin = state.areaSqFt * pricing.projectTypeRates[projectType].min;
                baseMax = state.areaSqFt * pricing.projectTypeRates[projectType].max;
            }
            
            baseMin *= pricing.designComplexityMultipliers[designComplexity].min; baseMax *= pricing.designComplexityMultipliers[designComplexity].max;
            costMin += baseMin; costMax += baseMax;

            if (getElementValue(elements.plantingCheckbox)) { costMin += state.areaSqFt * pricing.addOns.planting.min; costMax += state.areaSqFt * pricing.addOns.planting.max; }
            if (getElementValue(elements.lightingCheckbox)) { costMin += pricing.addOns.lighting.min; costMax += pricing.addOns.lighting.max; }
            if (getElementValue(elements.waterFeatureCheckbox)) { costMin += pricing.addOns.waterFeature.min; costMax += pricing.addOns.waterFeature.max; }
            if (getElementValue(elements.retainingWallCheckbox)) { costMin += state.retainingWallLength * pricing.addOns.retainingWallPerFt.min; costMax += state.retainingWallLength * pricing.addOns.retainingWallPerFt.max; }
            
            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const elements = this.elements;
            elements.projectTypeSelect.addEventListener('change', this.initDisplay);
            elements.areaSqFtInput.addEventListener('input', calculateOverallCost);
            elements.estimatedHoursInput.addEventListener('input', calculateOverallCost);
            elements.designComplexitySelect.addEventListener('change', calculateOverallCost);
            elements.plantingCheckbox.addEventListener('change', calculateOverallCost);
            elements.lightingCheckbox.addEventListener('change', calculateOverallCost);
            elements.waterFeatureCheckbox.addEventListener('change', calculateOverallCost);
            setupAddonVisibility('landscapingRetainingWall', 'landscapingRetainingWallInputs', 'landscapingRetainingWallLength');
            document.getElementById('landscapingRetainingWallLength').addEventListener('input', calculateOverallCost);
        },
        initDisplay: function() {
            const elements = this.elements;
            const projectType = getElementValue(elements.projectTypeSelect);
            if (projectType === 'otherCustom') { elements.areaSqFtGroup.classList.add('hidden'); elements.estimatedHoursGroup.classList.remove('hidden'); }
            else { elements.estimatedHoursGroup.classList.add('hidden'); elements.areaSqFtGroup.classList.remove('hidden'); }
            elements.retainingWallInputsDiv.classList.toggle('hidden', !getElementValue(elements.retainingWallCheckbox));
        }
    },
    'handyman-services': {
        state: { estimatedHours: 2, numItems: 1 },
        pricing: {
            hourlyRate: { min: 50, max: 90 },
            fixedTaskRates: {
                'fixtureInstallation': { min: 100, max: 250 }, 'drywallRepair': { min: 75, max: 200 },
                'doorWindowRepair': { min: 150, max: 350 }, 'mounting': { min: 75, max: 150 },
                'furnitureAssembly': { min: 80, max: 200 }, 'minorPlumbingElectrical': { min: 120, max: 300 }
            },
            complexityMultipliers: { 'simple': { min: 1.0, max: 1.0 }, 'moderate': { min: 1.2, max: 1.5 }, 'complex': { min: 1.5, max: 2.0 } },
            addOns: { materialSourcing: { min: 30, max: 80 }, travelFee: { min: 40, max: 100 }, demolitionRemoval: { min: 75, max: 200 } },
            minimumJobFee: { min: 100, max: 250 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing; const elements = this.elements;
            const serviceType = getElementValue(elements.serviceTypeSelect);
            state.estimatedHours = getElementValue(elements.estimatedHoursInput);
            state.numItems = parseFloat(elements.numItemsValueSpan.textContent) || 0;
            const complexity = getElementValue(elements.complexitySelect);

            let baseMin = 0; let baseMax = 0;
            if (serviceType === 'hourly') { baseMin = state.estimatedHours * pricing.hourlyRate.min; baseMax = state.estimatedHours * pricing.hourlyRate.max; }
            else {
                baseMin = pricing.fixedTaskRates[serviceType].min; baseMax = pricing.fixedTaskRates[serviceType].max;
                if (serviceType === 'fixtureInstallation' || serviceType === 'mounting' || serviceType === 'furnitureAssembly') {
                    baseMin *= state.numItems; baseMax *= state.numItems;
                }
            }
            
            baseMin *= pricing.complexityMultipliers[complexity].min; baseMax *= pricing.complexityMultipliers[complexity].max;
            costMin += baseMin; costMax += baseMax;

            if (getElementValue(elements.materialSourcingCheckbox)) { costMin += pricing.addOns.materialSourcing.min; costMax += pricing.addOns.materialSourcing.max; }
            if (getElementValue(elements.travelFeeCheckbox)) { costMin += pricing.addOns.travelFee.min; costMax += pricing.addOns.travelFee.max; }
            if (getElementValue(elements.demolitionRemovalCheckbox)) { costMin += pricing.addOns.demolitionRemoval.min; costMax += pricing.addOns.demolitionRemoval.max; }
            
            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const elements = this.elements;
            elements.serviceTypeSelect.addEventListener('change', this.initDisplay);
            elements.estimatedHoursInput.addEventListener('input', calculateOverallCost);
            elements.complexitySelect.addEventListener('change', calculateOverallCost);
            elements.materialSourcingCheckbox.addEventListener('change', calculateOverallCost);
            elements.travelFeeCheckbox.addEventListener('change', calculateOverallCost);
            elements.demolitionRemovalCheckbox.addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const elements = this.elements;
            const serviceType = getElementValue(elements.serviceTypeSelect);
            if (serviceType === 'hourly') { elements.estimatedHoursGroup.classList.remove('hidden'); elements.numItemsGroup.classList.add('hidden'); }
            else if (serviceType === 'fixtureInstallation' || serviceType === 'mounting' || serviceType === 'furnitureAssembly') { elements.estimatedHoursGroup.classList.add('hidden'); elements.numItemsGroup.classList.remove('hidden'); }
            else { elements.estimatedHoursGroup.classList.add('hidden'); elements.numItemsGroup.classList.add('hidden'); }
        }
    },
    'hvac': {
        state: { propertySize: 2000 },
        pricing: {
            diagnosticRepair: { min: 150, max: 300 },
            maintenanceTuneUp: { min: 100, max: 200 },
            newInstallationBase: { min: 3000, max: 8000 },
            ductworkRepair: { min: 500, max: 2000 },
            systemTypeAdjustments: { 'centralAC': { min: 1.0, max: 1.0 }, 'furnace': { min: 0.9, max: 1.1 }, 'heatPump': { min: 1.1, max: 1.3 }, 'miniSplit': { min: 0.8, max: 1.0 }, 'boiler': { min: 1.5, max: 2.0 } },
            propertySizeMultipliers: { '500-1500': { min: 0.8, max: 0.9 }, '1501-3000': { min: 1.0, max: 1.0 }, '3001+': { min: 1.1, max: 1.3 } },
            repairComplexityMultipliers: { 'minor': { min: 0.8, max: 1.0 }, 'moderate': { min: 1.2, max: 1.5 }, 'major': { min: 1.5, max: 2.0 } },
            addOns: { airQuality: { min: 200, max: 500 }, smartThermostat: { min: 150, max: 300 }, emergencyService: { min: 100, max: 250 }, permitRequired: { min: 50, max: 200 } },
            minimumJobFee: { min: 150, max: 300 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing; const elements = this.elements;
            const serviceType = getElementValue(elements.serviceTypeSelect);
            const systemType = getElementValue(elements.systemTypeSelect);
            state.propertySize = getElementValue(elements.propertySizeInput);
            const repairComplexity = getElementValue(elements.repairComplexitySelect);

            let baseMin = 0; let baseMax = 0;
            
            if (serviceType === 'diagnosticRepair') {
                baseMin = pricing.diagnosticRepair.min; baseMax = pricing.diagnosticRepair.max;
                baseMin *= pricing.repairComplexityMultipliers[repairComplexity].min; baseMax *= pricing.repairComplexityMultipliers[repairComplexity].max;
            } else if (serviceType === 'maintenanceTuneUp') {
                baseMin = pricing.maintenanceTuneUp.min; baseMax = pricing.maintenanceTuneUp.max;
            } else if (serviceType === 'newInstallation') {
                baseMin = pricing.newInstallationBase.min; baseMax = pricing.newInstallationBase.max;
                baseMin *= pricing.systemTypeAdjustments[systemType].min; baseMax *= pricing.systemTypeAdjustments[systemType].max;
                
                let sizeKey = '500-1500';
                if (state.propertySize > 1500 && state.propertySize <= 3000) sizeKey = '1501-3000';
                else if (state.propertySize > 3000) sizeKey = '3001+';
                baseMin *= pricing.propertySizeMultipliers[sizeKey].min; baseMax *= pricing.propertySizeMultipliers[sizeKey].max;

            } else if (serviceType === 'ductwork') {
                baseMin = pricing.ductworkRepair.min; baseMax = pricing.ductworkRepair.max;
                let sizeKey = '500-1500';
                if (state.propertySize > 1500 && state.propertySize <= 3000) sizeKey = '1501-3000';
                else if (state.propertySize > 3000) sizeKey = '3001+';
                baseMin *= pricing.propertySizeMultipliers[sizeKey].min; baseMax *= pricing.propertySizeMultipliers[sizeKey].max;
            }
            costMin += baseMin; costMax += baseMax;

            if (getElementValue(elements.airQualityCheckbox)) { costMin += pricing.addOns.airQuality.min; costMax += pricing.addOns.airQuality.max; }
            if (getElementValue(elements.smartThermostatCheckbox)) { costMin += pricing.addOns.smartThermostat.min; costMax += pricing.addOns.smartThermostat.max; }
            if (getElementValue(elements.emergencyServiceCheckbox)) { costMin += pricing.addOns.emergencyService.min; costMax += pricing.addOns.emergencyService.max; }
            if (getElementValue(elements.permitRequiredCheckbox)) { costMin += pricing.addOns.permitRequired.min; costMax += pricing.addOns.permitRequired.max; }

            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const elements = this.elements;
            elements.serviceTypeSelect.addEventListener('change', this.initDisplay);
            elements.systemTypeSelect.addEventListener('change', calculateOverallCost);
            elements.propertySizeInput.addEventListener('input', calculateOverallCost);
            elements.repairComplexitySelect.addEventListener('change', calculateOverallCost);
            elements.airQualityCheckbox.addEventListener('change', calculateOverallCost);
            elements.smartThermostatCheckbox.addEventListener('change', calculateOverallCost);
            elements.emergencyServiceCheckbox.addEventListener('change', calculateOverallCost);
            elements.permitRequiredCheckbox.addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const elements = this.elements;
            const serviceType = getElementValue(elements.serviceTypeSelect);
            if (serviceType === 'diagnosticRepair') { elements.repairComplexityGroup.classList.remove('hidden'); }
            else { elements.repairComplexityGroup.classList.add('hidden'); }
        }
    },
    'electrical-services': {
        state: { estimatedHours: 2, numUnits: 1 },
        pricing: {
            hourlyRate: { min: 75, max: 150 },
            fixedTaskRates: {
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
            const state = this.state; const pricing = this.pricing; const elements = this.elements;
            const serviceType = getElementValue(elements.serviceTypeSelect);
            state.estimatedHours = getElementValue(elements.estimatedHoursInput);
            state.numUnits = parseFloat(elements.numUnitsValueSpan.textContent) || 0;
            const complexity = getElementValue(elements.complexitySelect);

            let baseMin = 0; let baseMax = 0;
            if (serviceType === 'repairTroubleshoot') { baseMin = state.estimatedHours * pricing.hourlyRate.min; baseMax = state.estimatedHours * pricing.hourlyRate.max; }
            else {
                baseMin = pricing.fixedTaskRates[serviceType].min; baseMax = pricing.fixedTaskRates[serviceType].max;
                if (serviceType === 'outletSwitchInstall' || serviceType === 'lightFixtureInstall') {
                    baseMin *= state.numUnits; baseMax *= state.numUnits;
                }
            }
            baseMin *= pricing.complexityMultipliers[complexity].min; baseMax *= pricing.complexityMultipliers[complexity].max;
            costMin += baseMin; costMax += baseMax;

            if (getElementValue(elements.permitInspectionCheckbox)) { costMin += pricing.addOns.permitInspection.min; costMax += pricing.addOns.permitInspection.max; }
            if (getElementValue(elements.materialCostExtraCheckbox)) { costMin += pricing.addOns.materialCostExtra.min; costMax += pricing.addOns.materialCostExtra.max; }
            if (getElementValue(elements.emergencyServiceCheckbox)) { costMin += pricing.addOns.emergencyService.min; costMax += pricing.addOns.emergencyService.max; }

            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const elements = this.elements;
            elements.serviceTypeSelect.addEventListener('change', this.initDisplay);
            elements.estimatedHoursInput.addEventListener('input', calculateOverallCost);
            elements.complexitySelect.addEventListener('change', calculateOverallCost);
            elements.permitInspectionCheckbox.addEventListener('change', calculateOverallCost);
            elements.materialCostExtraCheckbox.addEventListener('change', calculateOverallCost);
            elements.emergencyServiceCheckbox.addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const elements = this.elements;
            const serviceType = getElementValue(elements.serviceTypeSelect);
            if (serviceType === 'repairTroubleshoot') { elements.estimatedHoursGroup.classList.remove('hidden'); elements.numUnitsGroup.classList.add('hidden'); }
            else if (serviceType === 'outletSwitchInstall' || serviceType === 'lightFixtureInstall') { elements.estimatedHoursGroup.classList.add('hidden'); elements.numUnitsGroup.classList.remove('hidden'); }
            else { elements.estimatedHoursGroup.classList.add('hidden'); elements.numUnitsGroup.classList.add('hidden'); } // Other fixed tasks
        }
    },
    'roofing': {
        state: { areaSqFt: 1500 },
        pricing: {
            serviceTypeRates: {
                'repair': { min: 300, max: 1000 },
                'replacement': { min: 4, max: 10 },
                'inspection': { min: 150, max: 300 },
                'cleaning': { min: 0.30, max: 0.70 }
            },
            repairComplexityMultipliers: { 'minor': { min: 0.8, max: 1.0 }, 'moderate': { min: 1.2, max: 1.5 }, 'major': { min: 1.5, max: 2.0 } },
            materialMultipliers: { 'asphaltShingles': { min: 1.0, max: 1.0 }, 'metal': { min: 2.0, max: 3.5 }, 'tile': { min: 2.5, max: 4.0 }, 'woodShake': { min: 2.0, max: 3.0 }, 'flatRoof': { min: 1.5, max: 2.5 } },
            storyHeightMultipliers: { '1': { min: 1.0, max: 1.0 }, '2': { min: 1.15, max: 1.35 }, '3': { min: 1.4, max: 1.8 } },
            addOns: { oldRoofRemoval: { min: 1.0, max: 2.0 }, gutterWork: { min: 100, max: 300 }, skylightWork: { min: 200, max: 500 }, permitFees: { min: 75, max: 250 } },
            minimumJobFee: { min: 300, max: 600 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing; const elements = this.elements;
            const serviceType = getElementValue(elements.serviceTypeSelect);
            state.areaSqFt = getElementValue(elements.areaSqFtInput);
            const repairComplexity = getElementValue(elements.repairComplexitySelect);
            const materialType = getElementValue(elements.materialTypeSelect);
            const storyHeight = getElementValue(elements.storyHeightSelect);

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
            if (serviceType === 'replacement' || serviceType === 'cleaning' || serviceType === 'repair') {
                baseMin *= pricing.storyHeightMultipliers[storyHeight].min; baseMax *= pricing.storyHeightMultipliers[storyHeight].max;
            }
            costMin += baseMin; costMax += baseMax;

            if (getElementValue(elements.oldRoofRemovalCheckbox) && serviceType === 'replacement') { costMin += state.areaSqFt * pricing.addOns.oldRoofRemoval.min; costMax += state.areaSqFt * pricing.addOns.oldRoofRemoval.max; }
            if (getElementValue(elements.gutterWorkCheckbox)) { costMin += pricing.addOns.gutterWork.min; costMax += pricing.addOns.gutterWork.max; }
            if (getElementValue(elements.skylightWorkCheckbox)) { costMin += pricing.addOns.skylightWork.min; costMax += pricing.addOns.skylightWork.max; }
            if (getElementValue(elements.permitFeesCheckbox)) { costMin += pricing.addOns.permitFees.min; costMax += pricing.addOns.permitFees.max; }
            
            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const elements = this.elements;
            elements.serviceTypeSelect.addEventListener('change', this.initDisplay);
            elements.areaSqFtInput.addEventListener('input', calculateOverallCost);
            elements.repairComplexitySelect.addEventListener('change', calculateOverallCost);
            elements.materialTypeSelect.addEventListener('change', calculateOverallCost);
            elements.storyHeightSelect.addEventListener('change', calculateOverallCost);
            elements.oldRoofRemovalCheckbox.addEventListener('change', calculateOverallCost);
            elements.gutterWorkCheckbox.addEventListener('change', calculateOverallCost);
            elements.skylightWorkCheckbox.addEventListener('change', calculateOverallCost);
            elements.permitFeesCheckbox.addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const elements = this.elements;
            const serviceType = getElementValue(elements.serviceTypeSelect);
            
            elements.repairComplexityGroup.classList.toggle('hidden', serviceType !== 'repair');
            const showAreaMaterialStory = (serviceType === 'replacement' || serviceType === 'cleaning');
            elements.areaSqFtGroup.classList.toggle('hidden', !showAreaMaterialStory);
            elements.materialTypeGroup.classList.toggle('hidden', !showAreaMaterialStory);
            elements.storyHeightGroup.classList.toggle('hidden', !showAreaMaterialStory);
        }
    },
    'plumbing': {
        state: { estimatedHours: 1, numFixtures: 1 },
        pricing: {
            hourlyRate: { min: 80, max: 180 },
            fixedTaskRates: {
                'clogDrain': { min: 100, max: 300 }, 'leakyFaucet': { min: 100, max: 250 },
                'waterHeater': { min: 400, max: 1500 },
                'newFixtureInstall': { min: 150, max: 400 },
                'pipeRepairReplace': { min: 200, max: 800 },
                'sewerLine': { min: 1000, max: 5000 }
            },
            accessLevelMultipliers: { 'easy': { min: 1.0, max: 1.0 }, 'moderate': { min: 1.2, max: 1.5 }, 'difficult': { min: 1.5, max: 2.0 } },
            addOns: { emergencyService: { min: 150, max: 400 }, cameraInspection: { min: 200, max: 500 }, permitRequired: { min: 75, max: 250 } },
            minimumJobFee: { min: 150, max: 300 }
        },
        calculate: function() {
            let costMin = 0; let costMax = 0;
            const state = this.state; const pricing = this.pricing; const elements = this.elements;
            const serviceType = getElementValue(elements.serviceTypeSelect);
            state.estimatedHours = getElementValue(elements.estimatedHoursInput);
            state.numFixtures = parseFloat(elements.numFixturesValueSpan.textContent) || 0;
            const accessLevel = getElementValue(elements.accessLevelSelect);

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

            if (getElementValue(elements.emergencyServiceCheckbox)) { costMin += pricing.addOns.emergencyService.min; costMax += pricing.addOns.emergencyService.max; }
            if (getElementValue(elements.cameraInspectionCheckbox)) { costMin += pricing.addOns.cameraInspection.min; costMax += pricing.addOns.cameraInspection.max; }
            if (getElementValue(elements.permitRequiredCheckbox)) { costMin += pricing.addOns.permitRequired.min; costMax += pricing.addOns.permitRequired.max; }
            
            costMin = Math.max(costMin, pricing.minimumJobFee.min); costMax = Math.max(costMax, pricing.minimumJobFee.max);
            return { min: costMin, max: costMax };
        },
        initListeners: function() {
            const elements = this.elements;
            elements.serviceTypeSelect.addEventListener('change', this.initDisplay);
            elements.estimatedHoursInput.addEventListener('input', calculateOverallCost);
            elements.accessLevelSelect.addEventListener('change', calculateOverallCost);
            elements.emergencyServiceCheckbox.addEventListener('change', calculateOverallCost);
            elements.cameraInspectionCheckbox.addEventListener('change', calculateOverallCost);
            elements.permitRequiredCheckbox.addEventListener('change', calculateOverallCost);
        },
        initDisplay: function() {
            const elements = this.elements;
            const serviceType = getElementValue(elements.serviceTypeSelect);
            if (serviceType === 'other') { elements.estimatedHoursGroup.classList.remove('hidden'); elements.numFixturesGroup.classList.add('hidden'); }
            else if (serviceType === 'newFixtureInstall') { elements.estimatedHoursGroup.classList.add('hidden'); elements.numFixturesGroup.classList.remove('hidden'); }
            else { elements.estimatedHoursGroup.classList.add('hidden'); elements.numFixturesGroup.classList.add('hidden'); }
        }
    }
};

// --- UNIVERSAL MASTER CONTROL FUNCTIONS ---
function updateEstimatedCost(min, max) {
    min = Math.max(0, min);
    max = Math.max(0, max);
    globalElements.estimatedCostDisplay.textContent = `$${Math.round(min)} – $${Math.round(max)}`;
}

function calculateOverallCost() {
    let costs = { min: 0, max: 0 };
    if (industries[currentIndustry] && industries[currentIndustry].calculate) {
        costs = industries[currentIndustry].calculate();
    }

    universalDiscountPercent = getElementValue(globalElements.universalDiscountInput);
    const discountFactor = (100 - universalDiscountPercent) / 100;
    costs.min *= discountFactor;
    costs.max *= discountFactor;

    updateEstimatedCost(costs.min, costs.max);
}

function showIndustryForm(industryId) {
    // Hide all form sections
    document.querySelectorAll('.rg-calc-form-section').forEach(form => form.classList.add('hidden'));

    // Deactivate all industry buttons
    for (const id in globalElements.industryButtons) {
        globalElements.industryButtons[id].classList.remove('active');
    }

    // Show selected form and activate its button
    const selectedForm = document.getElementById(`${industryId}-form`);
    const buttonId = `btn${industryId.charAt(0).toUpperCase() + industryId.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase())}`;
    const selectedButton = document.getElementById(buttonId);
    
    if (selectedForm) { selectedForm.classList.remove('hidden'); }
    if (selectedButton) { selectedButton.classList.add('active'); }

    currentIndustry = industryId; // Update global state

    // Initialize display of the newly visible form (handles toggles/checkboxes visibility)
    if (industries[currentIndustry] && industries[currentIndustry].initDisplay) {
        industries[currentIndustry].initDisplay();
    }
    calculateOverallCost(); // Recalculate cost for the newly displayed industry
}


// --- INITIALIZATION ON PAGE LOAD ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Collect all global DOM element references
    globalElements.estimatedCostDisplay = document.getElementById('estimatedCost');
    globalElements.universalDiscountInput = document.getElementById('universalDiscount');
    globalElements.calculatorFormsContainer = document.getElementById('calculatorFormsContainer');
    
    document.querySelectorAll('.rg-calc-industry-btn-group .rg-calc-industry-btn').forEach(button => {
        globalElements.industryButtons[button.id] = button;
    });

    // 2. Collect elements for each specific industry calculator
    industries.cleaning.elements = {
        form: document.getElementById('cleaning-form'),
        toggle: document.getElementById('cleaningToggle'),
        roomsLabel: document.getElementById('cleaningRoomsLabel'),
        sqFtLabel: document.getElementById('cleaningSqFtLabel'),
        roomBasedInputs: document.getElementById('cleaningRoomBasedInputs'),
        bathroomInputs: document.getElementById('cleaningBathroomInputs'),
        squareFootageInput: document.getElementById('cleaningSquareFootageInput'),
        squareFootageField: document.getElementById('cleaningSquareFootage'),
        visitTypeSelect: document.getElementById('cleaningVisitType'),
        floorCleaningCheckbox: document.getElementById('cleaningFloorCleaning'),
        appliancesCheckbox: document.getElementById('cleaningAppliances'),
        windowCleaningCheckbox: document.getElementById('cleaningWindowCleaning'),
        laundryCheckbox: document.getElementById('cleaningLaundry'),
        bedroomsValueSpan: document.getElementById('cleaningBedroomsValue'),
        bathroomsValueSpan: document.getElementById('cleaningBathroomsValue')
    };

    industries['lawn-care'].elements = {
        form: document.getElementById('lawn-care-form'),
        areaToggle: document.getElementById('lawnAreaToggle'),
        sqFtLabel: document.getElementById('lawnSqFtLabel'),
        acresLabel: document.getElementById('lawnAcresLabel'),
        lawnMowingCheckbox: document.getElementById('lawnMowing'),
        lawnMowingInputs: document.getElementById('lawnMowingInputs'),
        lawnMowingAreaInput: document.getElementById('lawnMowingArea'),
        lawnAerationCheckbox: document.getElementById('lawnAeration'),
        lawnAerationInputs: document.getElementById('lawnAerationInputs'),
        lawnAerationTypeSelect: document.getElementById('lawnAerationType'),
        lawnAerationAreaInput: document.getElementById('lawnAerationArea'),
        lawnDethatchingCheckbox: document.getElementById('lawnDethatching'),
        lawnDethatchingInputs: document.getElementById('lawnDethatchingInputs'),
        lawnDethatchingAreaInput: document.getElementById('lawnDethatchingArea'),
        lawnFertilizationCheckbox: document.getElementById('lawnFertilization'),
        lawnFertilizationInputs: document.getElementById('lawnFertilizationInputs'),
        lawnFertilizationAreaInput: document.getElementById('lawnFertilizationArea'),
        lawnMulchCleanUpCheckbox: document.getElementById('lawnMulchCleanUp'),
        lawnMulchCleanUpInputs: document.getElementById('lawnMulchCleanUpInputs'),
        lawnMulchCleanUpAmountInput: document.getElementById('lawnMulchCleanUpAmount'),
        lawnSeedingCheckbox: document.getElementById('lawnSeeding'),
        lawnSeedingInputs: document.getElementById('lawnSeedingInputs'),
        lawnSeedingAreaInput: document.getElementById('lawnSeedingArea'),
        lawnLeafRemovalCheckbox: document.getElementById('lawnLeafRemoval'),
        lawnLeafRemovalInputs: document.getElementById('lawnLeafRemovalInputs'),
        lawnLeafRemovalHoursInput: document.getElementById('lawnLeafRemovalHours'),
        lawnYardCleanupCheckbox: document.getElementById('lawnYardCleanup'),
        lawnYardCleanupInputs: document.getElementById('lawnYardCleanupInputs'),
        lawnYardCleanupHoursInput: document.getElementById('lawnYardCleanupHours'),
        lawnWeedControlCheckbox: document.getElementById('lawnWeedControl'),
        lawnWeedControlInputs: document.getElementById('lawnWeedControlInputs'),
        lawnWeedControlAreaInput: document.getElementById('lawnWeedControlArea')
    };

    industries.painting.elements = {
        form: document.getElementById('painting-form'),
        areaToggle: document.getElementById('paintingAreaToggle'),
        sqFtLabel: document.getElementById('paintingSqFtLabel'),
        roomsLabel: document.getElementById('paintingRoomsLabel'),
        areaLabel: document.getElementById('paintingAreaLabel'),
        areaValueInput: document.getElementById('paintingAreaValue'),
        areaUnitSpan: document.getElementById('paintingAreaUnit'),
        serviceTypeSelect: document.getElementById('paintingServiceType'),
        numCoatsSelect: document.getElementById('paintingNumCoats'),
        paintQualitySelect: document.getElementById('paintingPaintQuality'),
        wallPrepCheckbox: document.getElementById('paintingWallPrep'),
        trimPaintingCheckbox: document.getElementById('paintingTrimPainting'),
        ceilingPaintingCheckbox: document.getElementById('paintingCeilingPainting'),
        deckStainingCheckbox: document.getElementById('paintingDeckStaining')
    };

    industries.recycling.elements = {
        form: document.getElementById('recycling-form'),
        pickupFrequencySelect: document.getElementById('recyclingPickupFrequency'),
        numStandardBinsValueSpan: document.getElementById('recyclingNumStandardBinsValue'),
        removeApplianceCheckbox: document.getElementById('recyclingRemoveAppliance'),
        applianceInputsDiv: document.getElementById('recyclingApplianceInputs'),
        numAppliancesInput: document.getElementById('recyclingNumAppliances'),
        removeElectronicsCheckbox: document.getElementById('recyclingRemoveElectronics'),
        electronicsInputsDiv: document.getElementById('recyclingElectronicsInputs'),
        numElectronicsInput: document.getElementById('recyclingNumElectronics'),
        removeTiresCheckbox: document.getElementById('recyclingRemoveTires'),
        tiresInputsDiv: document.getElementById('recyclingTiresInputs'),
        numTiresInput: document.getElementById('recyclingNumTires'),
        removeFurnitureCheckbox: document.getElementById('recyclingRemoveFurniture'),
        furnitureInputsDiv: document.getElementById('recyclingFurnitureInputs'),
        numFurnitureInput: document.getElementById('recyclingNumFurniture'),
        documentShreddingCheckbox: document.getElementById('recyclingDocumentShredding'),
        hazardousWasteCheckbox: document.getElementById('recyclingHazardousWaste')
    };

    industries['window-cleaning'].elements = {
        form: document.getElementById('window-cleaning-form'),
        numStandardWindowsValueSpan: document.getElementById('windowNumStandardWindowsValue'),
        numFrenchPanesValueSpan: document.getElementById('windowNumFrenchPanesValue'),
        numSlidingDoorsValueSpan: document.getElementById('windowNumSlidingDoorsValue'),
        storyHeightSelect: document.getElementById('windowStoryHeight'),
        cleaningTypeSelect: document.getElementById('windowCleaningType'),
        screenCleaningCheckbox: document.getElementById('windowScreenCleaningCheckbox'),
        screenCleaningInputsDiv: document.getElementById('windowScreenCleaningInputs'),
        numScreensInput: document.getElementById('windowNumScreens'),
        trackCleaningCheckbox: document.getElementById('windowTrackCleaningCheckbox'),
        hardWaterCheckbox: document.getElementById('windowHardWaterCheckbox'),
        hardWaterInputsDiv: document.getElementById('windowHardWaterInputs'),
        numHardWaterWindowsInput: document.getElementById('windowNumHardWaterWindows'),
        skylightCleaningCheckbox: document.getElementById('windowSkylightCleaningCheckbox'),
        skylightCleaningInputsDiv: document.getElementById('windowSkylightCleaningInputs'),
        numSkylightsInput: document.getElementById('windowNumSkylights')
    };

    industries['pooper-scooper'].elements = {
        form: document.getElementById('pooper-scooper-form'),
        numDogsValueSpan: document.getElementById('pooperScooperNumDogsValue'),
        serviceFrequencySelect: document.getElementById('pooperScooperServiceFrequency'),
        yardSizeSelect: document.getElementById('pooperScooperYardSize'),
        initialCleanupConditionSelect: document.getElementById('pooperScooperInitialCleanupCondition'),
        yardSizeGroup: document.getElementById('pooperScooperYardSizeGroup'),
        initialCleanupConditionGroup: document.getElementById('pooperScooperInitialCleanupConditionGroup'),
        wasteHaulingCheckbox: document.getElementById('pooperScooperWasteHauling'),
        yardDeodorizingCheckbox: document.getElementById('pooperScooperYardDeodorizing'),
        patioHosingCheckbox: document.getElementById('pooperScooperPatioHosing')
    };

    industries['property-maintenance'].elements = {
        form: document.getElementById('property-maintenance-form'),
        propertyTypeSelect: document.getElementById('propertyMaintenancePropertyType'),
        serviceFrequencySelect: document.getElementById('propertyMaintenanceServiceFrequency'),
        estimatedHoursValueSpan: document.getElementById('propertyMaintenanceEstimatedHoursValue'),
        hourlyRateInput: document.getElementById('propertyMaintenanceHourlyRate'),
        gutterCleaningCheckbox: document.getElementById('propertyMaintenanceGutterCleaning'),
        basicLandscapingCheckbox: document.getElementById('propertyMaintenanceBasicLandscaping'),
        filterReplacementCheckbox: document.getElementById('propertyMaintenanceFilterReplacement'),
        pressureWashingSmallCheckbox: document.getElementById('propertyMaintenancePressureWashingSmall'),
        minorPlumbingCheckbox: document.getElementById('propertyMaintenanceMinorPlumbing'),
        minorElectricalCheckbox: document.getElementById('propertyMaintenanceMinorElectrical')
    };

    industries['pool-spa'].elements = {
        form: document.getElementById('pool-spa-form'),
        poolSpaTypeSelect: document.getElementById('poolSpaType'),
        poolSizeSelect: document.getElementById('poolSize'),
        poolSpaServiceFrequencySelect: document.getElementById('poolSpaServiceFrequency'),
        poolSpaOpeningClosingCheckbox: document.getElementById('poolSpaOpeningClosing'),
        poolSpaOpeningClosingInputs: document.getElementById('poolSpaOpeningClosingInputs'), // Div not select
        openingClosingTypeSelect: document.getElementById('poolSpaOpeningClosingType'),
        filterCleaningCheckbox: document.getElementById('poolSpaFilterCleaning'),
        algaeTreatmentCheckbox: document.getElementById('poolSpaAlgaeTreatment'),
        equipmentDiagnosticsCheckbox: document.getElementById('poolSpaEquipmentDiagnostics'),
        saltCellCleaningCheckbox: document.getElementById('poolSpaSaltCellCleaning')
    };

    industries['pressure-washing'].elements = {
        form: document.getElementById('pressure-washing-form'),
        surfaceTypeSelect: document.getElementById('pressureWashingSurfaceType'),
        areaValueInput: document.getElementById('pressureWashingAreaValue'),
        hourlyValueInput: document.getElementById('pressureWashingHourlyValue'),
        materialTypeSelect: document.getElementById('pressureWashingMaterialType'),
        dirtConditionSelect: document.getElementById('pressureWashingDirtCondition'),
        storyHeightSelect: document.getElementById('pressureWashingStoryHeight'),
        areaInputGroup: document.getElementById('pressureWashingAreaInputGroup'),
        hourlyInputGroup: document.getElementById('pressureWashingHourlyInputGroup'),
        materialTypeGroup: document.getElementById('pressureWashingMaterialTypeGroup'),
        storyHeightGroup: document.getElementById('pressureWashingStoryHeightGroup'),
        sealingCheckbox: document.getElementById('pressureWashingSealingCheckbox'),
        gutterBrighteningCheckbox: document.getElementById('pressureWashingGutterBrighteningCheckbox'),
        moldMildewTreatmentCheckbox: document.getElementById('pressureWashingMoldMildewTreatmentCheckbox')
    };

    industries.paving.elements = {
        form: document.getElementById('paving-form'),
        serviceTypeSelect: document.getElementById('pavingServiceType'),
        surfaceTypeSelect: document.getElementById('pavingSurfaceType'),
        materialSelect: document.getElementById('pavingMaterial'),
        areaValueInput: document.getElementById('pavingAreaValue'),
        thicknessSelect: document.getElementById('pavingThickness'),
        sitePreparationSelect: document.getElementById('pavingSitePreparation'),
        thicknessGroup: document.getElementById('pavingThicknessGroup'),
        repairPatchingGroup: document.getElementById('pavingRepairPatchingGroup'),
        numPatchesValueSpan: document.getElementById('pavingNumPatchesValue'),
        sealcoatingCheckbox: document.getElementById('pavingSealcoatingCheckbox'),
        drainageSolutionsCheckbox: document.getElementById('pavingDrainageSolutionsCheckbox'),
        edgingBordersCheckbox: document.getElementById('pavingEdgingBordersCheckbox'),
        lineStripingCheckbox: document.getElementById('pavingLineStripingCheckbox'),
        areaInputGroup: document.getElementById('pavingAreaInputGroup') // Area input group for visibility toggle
    };

    industries.installation.elements = {
        form: document.getElementById('installation-form'),
        typeSelect: document.getElementById('installationType'),
        numUnitsValueSpan: document.getElementById('installationNumUnitsValue'),
        estimatedHoursInput: document.getElementById('installationEstimatedHours'),
        complexitySelect: document.getElementById('installationComplexity'),
        removalNeededCheckbox: document.getElementById('installationRemovalNeeded'),
        numUnitsGroup: document.getElementById('installationNumUnitsGroup'),
        estimatedHoursGroup: document.getElementById('installationEstimatedHoursGroup'),
        disposalOfOldItemsCheckbox: document.getElementById('installationDisposalOfOldItems'),
        minorModificationsCheckbox: document.getElementById('installationMinorModifications'),
        testingCalibrationCheckbox: document.getElementById('installationTestingCalibration')
    };

    industries['junk-removal'].elements = {
        form: document.getElementById('junk-removal-form'),
        volumeSelect: document.getElementById('junkRemovalVolume'),
        typeSelect: document.getElementById('junkRemovalType'),
        accessibilitySelect: document.getElementById('junkRemovalAccessibility'),
        mattressSurchargeCheckbox: document.getElementById('junkRemovalMattressSurcharge'),
        mattressInputsDiv: document.getElementById('junkRemovalMattressInputs'),
        mattressesValueSpan: document.getElementById('junkRemovalMattressesValue'),
        tireSurchargeCheckbox: document.getElementById('junkRemovalTireSurcharge'),
        tireInputsDiv: document.getElementById('junkRemovalTireInputs'),
        tiresValueSpan: document.getElementById('junkRemovalTiresValue'),
        heavyItemSurchargeCheckbox: document.getElementById('junkRemovalHeavyItemSurcharge'),
        heavyItemInputsDiv: document.getElementById('junkRemovalHeavyItemInputs'),
        heavyItemsValueSpan: document.getElementById('junkRemovalHeavyItemsValue'),
        demolitionCheckbox: document.getElementById('junkRemovalDemolition'),
        demolitionInputsDiv: document.getElementById('junkRemovalDemolitionInputs'),
        demolitionHoursInput: document.getElementById('junkRemovalDemolitionHours'),
        cleanUpAfterCheckbox: document.getElementById('junkRemovalCleanUpAfter')
    };
    
    industries.irrigation.elements = {
        form: document.getElementById('irrigation-form'),
        serviceTypeSelect: document.getElementById('irrigationServiceType'),
        numZonesValueSpan: document.getElementById('irrigationNumZonesValue'),
        estimatedHoursInput: document.getElementById('irrigationEstimatedHours'),
        propertySizeSelect: document.getElementById('irrigationPropertySize'),
        numZonesGroup: document.getElementById('irrigationNumZonesGroup'),
        estimatedHoursGroup: document.getElementById('irrigationEstimatedHoursGroup'),
        dripSystemCheckbox: document.getElementById('irrigationDripSystem'),
        rainSensorCheckbox: document.getElementById('irrigationRainSensor'),
        backflowTestingCheckbox: document.getElementById('irrigationBackflowTesting')
    };

    industries.fence.elements = {
        form: document.getElementById('fence-form'),
        serviceTypeSelect: document.getElementById('fenceServiceType'),
        linearFeetInput: document.getElementById('fenceLinearFeet'),
        materialSelect: document.getElementById('fenceMaterial'),
        heightSelect: document.getElementById('fenceHeight'),
        repairSeveritySelect: document.getElementById('fenceRepairSeverity'),
        linearFeetGroup: document.getElementById('fenceLinearFeetGroup'),
        materialGroup: document.getElementById('fenceMaterialGroup'),
        repairSeverityGroup: document.getElementById('fenceRepairSeverityGroup'),
        gateInstallationCheckbox: document.getElementById('fenceGateInstallation'),
        gateInstallationInputsDiv: document.getElementById('fenceGateInstallationInputs'),
        numGatesValueSpan: document.getElementById('fenceNumGatesValue'),
        oldFenceRemovalCheckbox: document.getElementById('fenceOldFenceRemoval'),
        postCapsCheckbox: document.getElementById('fencePostCaps')
    };

    industries.janitorial.elements = {
        form: document.getElementById('janitorial-form'),
        propertyTypeSelect: document.getElementById('janitorialPropertyType'),
        areaSqFtInput: document.getElementById('janitorialAreaSqFt'),
        serviceFrequencySelect: document.getElementById('janitorialServiceFrequency'),
        numRestroomsValueSpan: document.getElementById('janitorialNumRestroomsValue'),
        floorCareCheckbox: document.getElementById('janitorialFloorCare'),
        windowCleaningCheckbox: document.getElementById('janitorialWindowCleaning'),
        trashRemovalCheckbox: document.getElementById('janitorialTrashRemoval'),
        suppliesProvidedCheckbox: document.getElementById('janitorialSuppliesProvided')
    };

    industries.flooring.elements = {
        form: document.getElementById('flooring-form'),
        serviceTypeSelect: document.getElementById('flooringServiceType'),
        materialTypeSelect: document.getElementById('flooringMaterialType'),
        areaSqFtInput: document.getElementById('flooringAreaSqFt'),
        subfloorConditionSelect: document.getElementById('flooringSubfloorCondition'),
        baseboardInstallationCheckbox: document.getElementById('flooringBaseboardInstallation'),
        furnitureMovingCheckbox: document.getElementById('flooringFurnitureMoving'),
        stairInstallationCheckbox: document.getElementById('flooringStairInstallation'),
        stairInstallationInputs: document.getElementById('flooringStairInstallationInputs'), // Div
        numStairsValueSpan: document.getElementById('flooringNumStairsValue')
    };

    industries['dog-walking'].elements = {
        form: document.getElementById('dog-walking-form'),
        numDogsValueSpan: document.getElementById('dogWalkingNumDogsValue'),
        durationSelect: document.getElementById('dogWalkingDuration'),
        frequencySelect: document.getElementById('dogWalkingFrequency'),
        weekendHolidayCheckbox: document.getElementById('dogWalkingWeekendHoliday'),
        additionalServicesCheckbox: document.getElementById('dogWalkingAdditionalServices'),
        puppySeniorCareCheckbox: document.getElementById('dogWalkingPuppySeniorCare')
    };

    industries['appliance-repair'].elements = {
        form: document.getElementById('appliance-repair-form'),
        applianceTypeSelect: document.getElementById('applianceType'),
        issueSeveritySelect: document.getElementById('issueSeverity'),
        repairUrgencySelect: document.getElementById('repairUrgency'),
        partsNeededCheckbox: document.getElementById('partsNeeded'),
        diagnosticFeeCheckbox: document.getElementById('diagnosticFee')
    };

    industries['chimney-sweep'].elements = {
        form: document.getElementById('chimney-sweep-form'),
        serviceTypeSelect: document.getElementById('chimneyServiceType'),
        chimneyTypeSelect: document.getElementById('chimneyType'),
        numFluesValueSpan: document.getElementById('chimneyFluesValue'),
        repairHoursInput: document.getElementById('chimneyRepairHours'),
        repairHoursGroup: document.getElementById('chimneyRepairHoursGroup'), // Div
        creosoteRemovalCheckbox: document.getElementById('chimneyCreosoteRemoval'),
        capInstallationCheckbox: document.getElementById('chimneyCapInstallation'),
        waterproofingCheckbox: document.getElementById('chimneyWaterproofing')
    };

    industries['carpet-cleaning'].elements = {
        form: document.getElementById('carpet-cleaning-form'),
        methodSelect: document.getElementById('carpetCleaningMethod'),
        areaTypeSelect: document.getElementById('carpetCleaningAreaType'),
        numRoomsValueSpan: document.getElementById('carpetCleaningNumRoomsValue'),
        areaSqFtInput: document.getElementById('carpetCleaningAreaSqFt'),
        conditionSelect: document.getElementById('carpetCondition'),
        numRoomsGroup: document.getElementById('carpetCleaningNumRoomsGroup'), // Div
        areaSqFtGroup: document.getElementById('carpetCleaningAreaSqFtGroup'), // Div
        spotTreatmentCheckbox: document.getElementById('carpetSpotTreatment'),
        deodorizingCheckbox: document.getElementById('carpetDeodorizing'),
        protectorCheckbox: document.getElementById('carpetProtector'),
        stairCleaningCheckbox: document.getElementById('carpetStairCleaning'),
        stairCleaningInputsDiv: document.getElementById('carpetStairCleaningInputs'), // Div
        numStairsValueSpan: document.getElementById('carpetCleaningNumStairsValue')
    };

    industries.carpentry.elements = {
        form: document.getElementById('carpentry-form'),
        projectTypeSelect: document.getElementById('carpentryProjectType'),
        estimatedHoursInput: document.getElementById('carpentryEstimatedHours'),
        complexitySelect: document.getElementById('carpentryComplexity'),
        materialQualitySelect: document.getElementById('carpentryMaterialQuality'),
        estimatedHoursGroup: document.getElementById('carpentryEstimatedHoursGroup'), // Div
        demolitionRemovalCheckbox: document.getElementById('carpentryDemolitionRemoval'),
        finishingStainingCheckbox: document.getElementById('carpentryFinishingStaining'),
        permitAssistanceCheckbox: document.getElementById('carpentryPermitAssistance')
    };

    industries['garage-services'].elements = {
        form: document.getElementById('garage-services-form'),
        serviceTypeSelect: document.getElementById('garageServiceType'),
        doorTypeSelect: document.getElementById('garageDoorType'),
        materialTypeSelect: document.getElementById('garageMaterialType'),
        repairSeveritySelect: document.getElementById('garageRepairSeverity'),
        repairSeverityGroup: document.getElementById('garageRepairSeverityGroup'), // Div
        oldDoorRemovalCheckbox: document.getElementById('garageOldDoorRemoval'),
        keypadRemoteCheckbox: document.getElementById('garageKeypadRemote'),
        smartOpenerCheckbox: document.getElementById('garageSmartOpener')
    };

    industries.professional.elements = {
        form: document.getElementById('professional-form'),
        serviceTypeSelect: document.getElementById('professionalServiceType'),
        estimatedHoursInput: document.getElementById('professionalEstimatedHours'),
        expertiseLevelSelect: document.getElementById('professionalExpertiseLevel'),
        travelFeeCheckbox: document.getElementById('professionalTravelFee'),
        materialSourcingCheckbox: document.getElementById('professionalMaterialSourcing'),
        followUpCheckbox: document.getElementById('professionalFollowUp')
    };

    industries['tree-services'].elements = {
        form: document.getElementById('tree-services-form'),
        serviceTypeSelect: document.getElementById('treeServiceType'),
        numTreesStumpsValueSpan: document.getElementById('treeCountValue'),
        accessibilitySelect: document.getElementById('treeAccessibility'),
        conditionSelect: document.getElementById('treeCondition'),
        debrisRemovalCheckbox: document.getElementById('treeDebrisRemoval'),
        limbingBranchChippingCheckbox: document.getElementById('treeLimbingBranchChipping'),
        permitAssistanceCheckbox: document.getElementById('treePermitAssistance')
    };

    industries['locksmith-services'].elements = {
        form: document.getElementById('locksmith-services-form'),
        serviceTypeSelect: document.getElementById('locksmithServiceType'),
        numLocksValueSpan: document.getElementById('locksmithNumLocksValue'),
        repairHoursInput: document.getElementById('locksmithRepairHours'),
        numKeysValueSpan: document.getElementById('locksmithNumKeysValue'),
        lockQualitySelect: document.getElementById('locksmithLockQuality'),
        numLocksGroup: document.getElementById('locksmithNumLocksGroup'),
        repairHoursGroup: document.getElementById('locksmithRepairHoursGroup'),
        keyExtraCopiesCheckbox: document.getElementById('locksmithKeyExtraCopies'),
        keyExtraCopiesInputs: document.getElementById('locksmithKeyExtraCopiesInputs'), // Div
        brokenKeyExtractionCheckbox: document.getElementById('locksmithBrokenKeyExtraction'),
        securityAuditCheckbox: document.getElementById('locksmithSecurityAudit')
    };

    industries['pet-services'].elements = {
        form: document.getElementById('pet-services-form'),
        serviceTypeSelect: document.getElementById('petServiceType'),
        petTypeSelect: document.getElementById('petType'),
        petSizeSelect: document.getElementById('petSize'),
        groomingPackageSelect: document.getElementById('petGroomingPackage'),
        groomingPackageGroup: document.getElementById('petGroomingPackageGroup'), // Div
        petSittingBoardingDurationGroup: document.getElementById('petSittingBoardingDurationGroup'), // Div
        durationValueSpan: document.getElementById('petSittingBoardingDurationValue'),
        specialNeedsCheckbox: document.getElementById('petSpecialNeeds'),
        extraPlayTimeCheckbox: document.getElementById('petExtraPlayTime'),
        transportationCheckbox: document.getElementById('petTransportation')
    };

    industries['landscaping-services'].elements = {
        form: document.getElementById('landscaping-services-form'),
        projectTypeSelect: document.getElementById('landscapingProjectType'),
        areaSqFtInput: document.getElementById('landscapingAreaSqFt'),
        estimatedHoursInput: document.getElementById('landscapingEstimatedHours'),
        designComplexitySelect: document.getElementById('landscapingDesignComplexity'),
        areaSqFtGroup: document.getElementById('landscapingAreaSqFtGroup'), // Div
        estimatedHoursGroup: document.getElementById('landscapingEstimatedHoursGroup'), // Div
        plantingCheckbox: document.getElementById('landscapingPlanting'),
        lightingCheckbox: document.getElementById('landscapingLighting'),
        waterFeatureCheckbox: document.getElementById('landscapingWaterFeature'),
        retainingWallCheckbox: document.getElementById('landscapingRetainingWall'),
        retainingWallInputs: document.getElementById('landscapingRetainingWallInputs'), // Div
        retainingWallLengthInput: document.getElementById('landscapingRetainingWallLength')
    };

    industries['handyman-services'].elements = {
        form: document.getElementById('handyman-services-form'),
        serviceTypeSelect: document.getElementById('handymanServiceType'),
        estimatedHoursInput: document.getElementById('handymanEstimatedHours'),
        numItemsValueSpan: document.getElementById('handymanNumItemsValue'),
        complexitySelect: document.getElementById('handymanComplexity'),
        estimatedHoursGroup: document.getElementById('handymanEstimatedHoursGroup'), // Div
        numItemsGroup: document.getElementById('handymanNumItemsGroup'), // Div
        materialSourcingCheckbox: document.getElementById('handymanMaterialSourcing'),
        travelFeeCheckbox: document.getElementById('handymanTravelFee'),
        demolitionRemovalCheckbox: document.getElementById('handymanDemolitionRemoval')
    };

    industries.hvac.elements = {
        form: document.getElementById('hvac-services-form'),
        serviceTypeSelect: document.getElementById('hvacServiceType'),
        systemTypeSelect: document.getElementById('hvacSystemType'),
        propertySizeInput: document.getElementById('hvacPropertySize'),
        repairComplexitySelect: document.getElementById('hvacRepairComplexity'),
        repairComplexityGroup: document.getElementById('hvacRepairComplexityGroup'), // Div
        airQualityCheckbox: document.getElementById('hvacAirQuality'),
        smartThermostatCheckbox: document.getElementById('hvacSmartThermostat'),
        emergencyServiceCheckbox: document.getElementById('hvacEmergencyService'),
        permitRequiredCheckbox: document.getElementById('hvacPermitRequired')
    };

    industries['electrical-services'].elements = {
        form: document.getElementById('electrical-services-form'),
        serviceTypeSelect: document.getElementById('electricalServiceType'),
        estimatedHoursInput: document.getElementById('electricalEstimatedHours'),
        numUnitsValueSpan: document.getElementById('electricalNumUnitsValue'),
        complexitySelect: document.getElementById('electricalComplexity'),
        estimatedHoursGroup: document.getElementById('electricalEstimatedHoursGroup'), // Div
        numUnitsGroup: document.getElementById('electricalNumUnitsGroup'), // Div
        permitInspectionCheckbox: document.getElementById('electricalPermitInspection'),
        materialCostExtraCheckbox: document.getElementById('electricalPermitInspection'), // Corrected to materialCostExtraCheckbox
        emergencyServiceCheckbox: document.getElementById('electricalEmergencyService')
    };
    
    industries['roofing-services'].elements = {
        form: document.getElementById('roofing-services-form'),
        serviceTypeSelect: document.getElementById('roofingServiceType'),
        areaSqFtInput: document.getElementById('roofingAreaSqFt'),
        repairComplexitySelect: document.getElementById('roofingRepairComplexity'),
        materialTypeSelect: document.getElementById('roofingMaterialType'),
        storyHeightSelect: document.getElementById('roofingStoryHeight'),
        areaSqFtGroup: document.getElementById('roofingAreaSqFtGroup'), // Div
        repairComplexityGroup: document.getElementById('roofingRepairComplexityGroup'), // Div
        materialTypeGroup: document.getElementById('roofingMaterialTypeGroup'), // Div
        storyHeightGroup: document.getElementById('roofingStoryHeightGroup'), // Div
        oldRoofRemovalCheckbox: document.getElementById('roofingOldRoofRemoval'),
        gutterWorkCheckbox: document.getElementById('roofingGutterWork'),
        skylightWorkCheckbox: document.getElementById('roofingSkylightWork'),
        permitFeesCheckbox: document.getElementById('roofingPermitFees')
    };

    industries.plumbing.elements = {
        form: document.getElementById('plumbing-services-form'),
        serviceTypeSelect: document.getElementById('plumbingServiceType'),
        estimatedHoursInput: document.getElementById('plumbingEstimatedHours'),
        numFixturesValueSpan: document.getElementById('plumbingNumFixturesValue'),
        accessLevelSelect: document.getElementById('plumbingAccessLevel'),
        estimatedHoursGroup: document.getElementById('plumbingEstimatedHoursGroup'), // Div
        numFixturesGroup: document.getElementById('plumbingNumFixturesGroup'), // Div
        emergencyServiceCheckbox: document.getElementById('plumbingEmergencyService'),
        cameraInspectionCheckbox: document.getElementById('plumbingCameraInspection'),
        permitRequiredCheckbox: document.getElementById('plumbingPermitRequired')
    };


    // 3. Attach all universal event listeners (delegated where possible)
    globalElements.universalDiscountInput.addEventListener('input', calculateOverallCost);

    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('rg-calc-counter-button')) {
            const field = event.target.dataset.field;
            const delta = parseInt(event.target.dataset.delta);
            // This is the common entry point for all counters.
            // Split field name to get industry and specific field in state
            let industryId;
            let stateField;
            if (field.startsWith('cleaning')) { industryId = 'cleaning'; stateField = field.substring(8).toLowerCase(); } // 'bedrooms', 'bathrooms'
            else if (field.startsWith('lawnMowing')) { industryId = 'lawn-care'; stateField = 'lawnMowingArea'; } // Lawn Mowing area is an input, not a counter span. This won't work as a counter.
            else if (field.startsWith('lawnAeration')) { industryId = 'lawn-care'; stateField = 'lawnAerationArea'; } // This also won't work for area inputs as counters
            else if (field.startsWith('lawnDethatching')) { industryId = 'lawn-care'; stateField = 'lawnDethatchingArea'; }
            else if (field.startsWith('lawnFertilization')) { industryId = 'lawn-care'; stateField = 'lawnFertilizationArea'; }
            else if (field.startsWith('lawnMulchCleanUp')) { industryId = 'lawn-care'; stateField = 'lawnMulchCleanUpAmount'; }
            else if (field.startsWith('lawnSeeding')) { industryId = 'lawn-care'; stateField = 'lawnSeedingArea'; }
            else if (field.startsWith('lawnLeafRemoval')) { industryId = 'lawn-care'; stateField = 'lawnLeafRemovalHours'; }
            else if (field.startsWith('lawnYardCleanup')) { industryId = 'lawn-care'; stateField = 'lawnYardCleanupHours'; }
            else if (field.startsWith('lawnWeedControl')) { industryId = 'lawn-care'; stateField = 'lawnWeedControlArea'; }
            else if (field.startsWith('recycling')) { industryId = 'recycling'; stateField = field.substring(9).toLowerCase(); }
            else if (field.startsWith('windowCleaning')) { industryId = 'window-cleaning'; stateField = field.substring(14).toLowerCase(); }
            else if (field.startsWith('pooperScooper')) { industryId = 'pooper-scooper'; stateField = field.substring(13).toLowerCase(); }
            else if (field.startsWith('propertyMaintenance')) { industryId = 'property-maintenance'; stateField = field.substring(19).toLowerCase(); }
            else if (field.startsWith('irrigation')) { industryId = 'irrigation'; stateField = field.substring(10).toLowerCase(); }
            else if (field.startsWith('fence')) { industryId = 'fence'; stateField = field.substring(5).toLowerCase(); }
            else if (field.startsWith('janitorial')) { industryId = 'janitorial'; stateField = field.substring(10).toLowerCase(); }
            else if (field.startsWith('flooring')) { industryId = 'flooring'; stateField = field.substring(8).toLowerCase(); }
            else if (field.startsWith('dogWalking')) { industryId = 'dog-walking'; stateField = field.substring(10).toLowerCase(); }
            else if (field.startsWith('chimneySweep')) { industryId = 'chimney-sweep'; stateField = field.substring(12).toLowerCase(); }
            else if (field.startsWith('carpetCleaning')) { industryId = 'carpet-cleaning'; stateField = field.substring(14).toLowerCase(); }
            else if (field.startsWith('carpentry')) { industryId = 'carpentry'; stateField = field.substring(9).toLowerCase(); }
            else if (field.startsWith('junkRemoval')) { industryId = 'junk-removal'; stateField = field.substring(11).toLowerCase(); }
            else if (field.startsWith('locksmithServices')) { industryId = 'locksmith-services'; stateField = field.substring(17).toLowerCase(); }
            else if (field.startsWith('petServices')) { industryId = 'pet-services'; stateField = field.substring(11).toLowerCase(); }
            else if (field.startsWith('plumbingServices')) { industryId = 'plumbing'; stateField = field.substring(16).toLowerCase(); }
            else if (field.startsWith('paving')) { industryId = 'paving'; stateField = field.substring(6).toLowerCase(); }
            // Add more conditions for other industries

            if (industryId && industries[industryId].state[stateField] !== undefined) {
                 industries[industryId].state[stateField] += delta;
                 const valueElement = document.getElementById(elementId);
                 if (valueElement) {
                     // Special handling for min values (e.g. 1 for rooms/dogs/etc)
                     if (stateField === 'bedrooms' || stateField === 'bathrooms' || stateField === 'numDogs' || stateField === 'numUnits' || stateField === 'numFlues' || stateField === 'numRooms' || stateField === 'numFixtures' || stateField === 'numPatches' || stateField === 'numGates' || stateField === 'numRestrooms' || stateField === 'numStairs' || stateField === 'duration') {
                         industries[industryId].state[stateField] = Math.max(1, industries[industryId].state[stateField]);
                     } else { // For quantities that can be 0 (e.g. junk items, screens, etc)
                         industries[industryId].state[stateField] = Math.max(0, industries[industryId].state[stateField]);
                     }
                     valueElement.textContent = industries[industryId].state[stateField];
                     calculateOverallCost();
                 }
            } else if (event.target.closest('.rg-calc-counter-input') && !event.target.dataset.field) {
                 // Fallback for counters that directly manipulate input.value
                 const input = event.target.parentNode.querySelector('input[type="number"]');
                 if (input) {
                     input.value = parseFloat(input.value) + delta;
                     calculateOverallCost();
                 }
            }
        }
    });


    // Initialize listeners for each industry's specific calculator
    for (const industryId in industries) {
        if (industries[industryId].initListeners) {
            // Collect elements specific to this industry's form
            const industryForm = document.getElementById(`${industryId}-form`);
            if (industryForm) {
                 const elements = {};
                 // Dynamically get elements by ID for this specific form
                 for (const key in industries[industryId].elements) {
                     if (typeof industries[industryId].elements[key] === 'string') { // If it's an ID, get the element
                         elements[key] = document.getElementById(industries[industryId].elements[key]);
                     } else { // It's already an element reference or complex object
                         elements[key] = industries[industryId].elements[key];
                     }
                 }
                 industries[industryId].elements = elements; // Update elements property
                 industries[industryId].initListeners();
            }
        }
    }

    // Get current URL path to determine initial calculator to show
    const path = window.location.pathname;
    let initialIndustry = 'cleaning'; // Default fallback

    // Map URL paths to industry IDs
    const pathToIndustryMap = {
        '/industry/cleaning': 'cleaning',
        '/industry/lawn-care': 'lawn-care',
        '/industry/painting': 'painting',
        '/industry/recycling': 'recycling',
        '/industry/window-cleaning': 'window-clean
