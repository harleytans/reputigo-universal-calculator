/*
 * script.js for Reputigo Universal Service Cost Calculator
 * Hosted on GitHub Pages / Netlify / Replit
 *
 * This file contains all JavaScript logic for the calculator components,
 * including state management, pricing data, calculation functions, and event listeners
 * for all supported service industries.
 */

// --- GLOBAL STATE AND HELPER FUNCTIONS ---
const SQFT_PER_ACRE = 43560; // For Lawn Care conversions

let currentIndustry = null; // Will be set on DOMContentLoaded or button click
let universalDiscountPercent = 0;

// Universal DOM elements (fetched once)
const estimatedCostDisplay = document.getElementById('estimatedCost');
const universalDiscountInput = document.getElementById('universalDiscount');
const calculatorFormsContainer = document.getElementById('calculatorFormsContainer');

// Generic helper to get element value (safe for elements that might not be visible)
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

// Generic counter adjustment (called by click listener on parent container)
function adjustCount(industryId, fieldType, delta) {
    const industry = industries[industryId];
    if (!industry || !industry.state) { return; }

    const state = industry.state;
    const elementId = industryId + fieldType.charAt(0).toUpperCase() + fieldType.slice(1) + 'Value';
    const valueSpan = document.getElementById(elementId);

    if (valueSpan) {
        let currentValue = state[fieldType]; // Get current value from state
        let newValue = currentValue + delta;

        // Apply minimums
        if (fieldType === 'bedrooms' || fieldType === 'bathrooms' || fieldType === 'numDogs' || fieldType === 'numUnits' || fieldType === 'numFlues' || fieldType === 'numRooms' || fieldType === 'numFixtures' || fieldType === 'numPatches' || fieldType === 'numGates' || fieldType === 'numRestrooms' || fieldType === 'numStairs' || fieldType === 'duration') {
             newValue = Math.max(1, newValue); // Min 1 for counts that cannot be 0
        } else if (fieldType === 'numStandardBins' || fieldType === 'mattresses' || fieldType === 'tires' || fieldType === 'heavyItems' || fieldType === 'numScreens' || fieldType === 'numHardWaterWindows' || fieldType === 'numSkylights' || fieldType === 'numKeys') {
            newValue = Math.max(0, newValue); // Min 0 for other quantities
        }
        
        state[fieldType] = newValue; // Update state
        valueSpan.textContent = newValue; // Update UI
        calculateOverallCost();
    }
}

// Helper for Lawn Care area conversion
function convertArea(value, fromUnit, toUnit) {
    if (fromUnit === toUnit) return value;
    if (fromUnit === 'sq.ft' && toUnit === 'acres') return value / SQFT_PER_ACRE;
    if (fromUnit === 'acres' && toUnit === 'sq.ft') return value * SQFT_PER_ACRE;
    return value; // Should not happen
}

// Helper to get cost for services that are area-based (sqft/acre)
function getCostForAreaService(areaInputId, sqFtCosts, acreCosts, isAcresMode) {
    const area = getElementValue(areaInputId);
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
            const cleaningToggle = document.getElementById('cleaningToggle');
            const roomsLabel = document.getElementById('cleaningRoomsLabel');
            const sqFtLabel = document.getElementById('cleaningSqFtLabel');
            const roomBasedInputs = document.getElementById('cleaningRoomBasedInputs');
            const bathroomInputs = document.getElementById('cleaningBathroomInputs');
            const squareFootageInput = document.getElementById('cleaningSquareFootageInput');

            this.state.isSqFtMode = cleaningToggle.checked; // Update state on display init

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
            lawnAerationLiquidSqFt: { min: 0.005, max: 0.010 }, lawnAerationCoreSqFt: { min
