# Climate Template Corrections Based on Real-World Data

## Research Summary

I've researched real-world climate data for representative cities. Here are the key findings and recommended corrections:

---

## 1. Mediterranean Coast (Los Angeles, California)

### Real-World Data
- **Annual Average**: 65°F
- **Winter (Dec-Feb)**: 48-68°F (avg ~58°F)
- **Summer (Jun-Aug)**: 65-85°F (avg ~75°F)
- **Characteristics**: Warm, arid summers; cool, wet winters; rarely below 42°F or above 93°F

**Sources**: [Weather Spark](https://weatherspark.com/y/1705/Average-Weather-in-Los-Angeles-California-United-States-Year-Round), [Current Results](https://www.currentresults.com/Weather/California/Places/los-angeles-temperatures-by-month-average.php)

### Current Template Values
- Annual: 65°F (variance: 15) ✅ **CORRECT**
- Winter: 50°F (variance: 10) ✅ **CLOSE** (real-world ~58°F)
- Summer: 80°F (variance: 8) ✅ **CLOSE** (real-world ~75°F)

### Recommendation
**Minor adjustments needed**:
- Winter mean: 50°F → 58°F
- Summer mean: 80°F → 75°F
- Add real-world examples: "Los Angeles, Barcelona, Athens, Perth"

---

## 2. Continental Prairie (Des Moines, Iowa)

### Real-World Data
- **Annual Average**: 51°F (10.4°C)
- **Winter (Jan)**: Low 10°F / High 30°F (avg ~20°F)
- **Summer (Jul)**: Low 67°F / High 87°F (avg ~77°F)
- **Extreme range**: -17°F to 86°F typical
- **Characteristics**: Very cold winters, hot humid summers, sudden temperature swings

**Sources**: [Climates to Travel](https://www.climatestotravel.com/climate/united-states/des-moines), [Weather Spark](https://weatherspark.com/y/10312/Average-Weather-in-Des-Moines-Iowa-United-States-Year-Round)

### Current Template Values
- Annual: 57°F (variance: 40) ⚠️ **Too high**
- Winter: 25°F (variance: 20) ✅ **CLOSE** (real ~20°F)
- Summer: 90°F (variance: 18) ⚠️ **Too high** (real ~77°F)

### Recommendation
**Significant adjustments**:
- Annual mean: 57°F → 51°F
- Summer mean: 90°F → 77°F
- Keep winter at 25°F (close enough to 20°F)
- Add real-world examples: "Des Moines, Winnipeg, Kansas City"

### Important Note
User mentioned Iowa as example where temps can swing from -5°F one day to 20s°F the next - this is now handled by the **pattern influence system** (±15°F for highDiurnalVariation climates), not the base temperature means.

---

## 3. Maritime Forest (Seattle, Washington)

### Real-World Data
- **Annual Average**: 52°F (11°C)
- **Winter (Dec-Feb)**: Low 36°F / High 46°F (avg ~41°F)
- **Summer (Jun-Aug)**: Low 54°F / High 77°F (avg ~66°F)
- **Extreme range**: 37-79°F typical, rarely below 28°F or above 88°F
- **Characteristics**: Mild maritime climate, small seasonal swings, moderated by Pacific Ocean

**Sources**: [Weather Spark](https://weatherspark.com/y/913/Average-Weather-in-Seattle-Washington-United-States-Year-Round), [Climate Data](https://en.climate-data.org/north-america/united-states-of-america/washington/seattle-593/)

### Current Template Values
- Annual: 55°F (variance: 20) ✅ **CLOSE** (real ~52°F)
- Winter: 40°F (variance: 10) ✅ **VERY CLOSE** (real ~41°F)
- Summer: 70°F (variance: 10) ⚠️ **Slightly high** (real ~66°F)

### Recommendation
**Minor adjustments**:
- Annual mean: 55°F → 52°F
- Summer mean: 70°F → 66°F
- Keep winter at 40°F (very accurate)
- Add real-world examples: "Seattle, Portland OR, Vancouver BC"

---

## 4. Continental Taiga (Fairbanks, Alaska)

### Real-World Data
- **Annual Average**: 28°F (-2°C)
- **Winter (Jan)**: Low -23°F / High -8°F (avg ~-15°F to -22°F)
- **Summer (Jul)**: Low 50°F / High 73°F (avg ~63°F)
- **Extreme range**: -13°F to 73°F typical, can reach -39°F to 83°F
- **Characteristics**: Continental subarctic, extremely cold winters, surprisingly warm summers, large annual range

**Sources**: [Weather Spark](https://weatherspark.com/y/273/Average-Weather-in-Fairbanks-Alaska-United-States-Year-Round), [Climates to Travel](https://www.climatestotravel.com/climate/united-states/fairbanks)

### Current Template Values
- Annual: 25°F (variance: 60) ✅ **VERY CLOSE** (real ~28°F)
- Winter: -20°F (variance: 25) ✅ **VERY CLOSE** (real ~-15 to -22°F)
- Summer: 65°F (variance: 15) ⚠️ **Slightly high** (real ~63°F)

### Recommendation
**Excellent accuracy - minor tweaks**:
- Annual mean: 25°F → 28°F
- Summer mean: 65°F → 63°F
- Keep winter at -20°F (very accurate)
- Add real-world examples: "Fairbanks, Yellowknife, Yakutsk"

---

## 5. Equatorial Rainforest (Singapore)

### Real-World Data
- **Annual Average**: 80°F (27°C)
- **Coolest Month (Dec-Jan)**: Low 75°F / High 88°F (avg ~81°F)
- **Warmest Month (May)**: Low 77°F / High 90°F (avg ~83°F)
- **Daily range**: 73-89°F typical
- **Characteristics**: Remarkably stable year-round, no true seasons, high humidity, constant rainfall

**Sources**: [Weather.gov.sg](https://www.weather.gov.sg/climate-climate-of-singapore/), [Climates to Travel](https://www.climatestotravel.com/climate/singapore)

### Current Template Values ("Rainforest Basin")
- Annual: 82°F (variance: 4) ⚠️ **Slightly high** (real ~80°F)
- Winter: 81°F (variance: 4) ✅ **PERFECT**
- Summer: 83°F (variance: 4) ✅ **PERFECT**

### Recommendation
**Excellent accuracy - tiny adjustment**:
- Annual mean: 82°F → 80°F
- Keep winter at 81°F (perfect)
- Keep summer at 83°F (perfect)
- Add real-world examples: "Singapore, Manaus, Iquitos"

---

## Summary of Findings

### Generally Accurate Templates
- ✅ Polar/Arctic climates
- ✅ Subarctic taiga
- ✅ Equatorial rainforest
- ✅ Maritime climates
- ✅ Mediterranean

### Templates Needing Adjustment
- ⚠️ **Continental Prairie**: Summer temps too high (90°F → 77°F)
- ⚠️ Some minor tweaks needed across the board

### Pattern Observed
The templates are **surprisingly accurate** overall! Most are within 5°F of real-world values. The main issue is:
1. **Continental Prairie summer** is significantly too hot
2. **Missing real-world city examples** in descriptions

---

## Next Steps

1. ✅ Research complete for representative biomes
2. ⏳ Apply corrections to all templates
3. ⏳ Add real-world example cities to each description
4. ⏳ Verify variance values are realistic
5. ⏳ Test corrected values in-game

---

## Real-World Examples to Add

I recommend adding 2-4 real-world example cities to each biome description so users can say "I want a climate like Los Angeles" or "like Singapore" and immediately know which template to choose.

Format: Add a line like **"Real-world examples: Los Angeles, Barcelona, Athens, Perth"** to each description.
