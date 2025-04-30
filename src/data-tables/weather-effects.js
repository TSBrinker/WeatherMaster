// data-tables/weather-effects.js
// Game effects for each weather condition

export const weatherEffects = {
    "Clear Skies": "This is the game as you normally play it. Clear bright light during day time, view of the stars and moon at night. No modifiers are added to play.",
    
    "Light Clouds": "The sky is partially cloudy. High flying aerial creatures have partial cover, and outdoor light still counts as sunlight.",
    
    "Heavy Clouds": "The sky is blocked. High flying aerial creatures have total cover, and outdoor light does not count as sunlight (for the purposes of sunlight sensitivity and similar traits). Checks using Navigation Tools to determine your location based on celestial observation are made with disadvantage.",
    
    "Rain": "Unpleasant to travel in. If you have wagons, your travel pace is slowed by half. If you attempt to take a long rest without cover, you must make a DC 12 Constitution saving throw gain the benefits for a long rest. All fire damage rolls have a –2.",
    
    "Heavy Rain": "Same as rain, but the DC becomes 16 to benefit from a long rest without shelter and if Heavy Rain occurs two days in a row wagon travel becomes impossible until one day without rain occurs. May cause flooding. All fire damage rolls have a –4. Lightning and Cold damage rolls gain a +2.",
    
    "Freezing Cold": "If you attempt to take a long rest without cover and heat, you must make a DC 15 Constitution saving throw gain the benefits for a long rest. If you fail by 5 or more, you gain an additional level of Exhaustion. All cold damage rolls have a +2.",
    
    "Snow": "Unpleasant to travel in. All travel speed is halved. If snow occurs for two days in row, all terrain is difficult terrain and wagon travel is impossible until one day without snow passes. Also has the the effect of Heavy Clouds and Freezing Cold.",
    
    "Scorching Heat": "Blistering heat that is unpleasant to travel in. Creatures that attempt to travel during day light hours require twice the ration of water, and creature that travel for 4 or more hours or engage in heavy activity for 1 or more hour during the day and do not immediately take a short or long rest under cover must make a DC 10 Constitution saving throw or gain a level of Exhaustion. All fire damage rolls have a +2. All cold damage rolls have a –2.",
    
    "Cold Winds": "Frigid blasts of air whip across the landscape. All creatures must make a DC 10 Constitution saving throw after each hour of travel or gain a level of exhaustion unless properly dressed for cold weather. Ranged attacks have disadvantage due to the wind.",
    
    "Thunderstorm": "Lightning flashes and thunder crashes. All creatures are partially obscured if they are more than 20 feet from you. If you travel for 4 or more hours during a Thunderstorm, roll a d20. On a 1, you are struck by a lightning bolt dealing 3d12 lightning damage. Lightning and Thunder damage rolls have a +2. Also has the effect of Rain, High Winds, Heavy Clouds.",
    
    "Blizzard": "At the end of every hour spend in a Blizzard, make a DC 12 Constitution saving. On failure, you take 3d4 cold damage and gain one level of exhaustion. You make this check with advantage if you have proper gear. All creatures are heavily obscured if they are more than 20 feet from you. All terrain is difficult terrain. Also has the effect of Snow, High Winds, and Freezing Cold.",
    
    "High Humidity Haze": "The air feels thick and oppressive. Constitution checks related to endurance or physical exertion are made with disadvantage. Water consumption is doubled for all creatures.",
    
    "Cold Snap": "An unseasonable cold spell. Creatures not accustomed to cold weather must make a DC 10 Constitution saving throw every 4 hours or gain a level of exhaustion. Plants may be damaged, affecting foraging attempts. Water sources may freeze over unexpectedly."
  };
  
  // Wind intensity effects based on wind speed (mph)
  export const windIntensityEffects = {
    "Calm": { // 0-5 mph
      min: 0,
      max: 5,
      effect: "Air is still or has very light breezes. No effect on gameplay."
    },
    "Breezy": { // 6-14 mph
      min: 6,
      max: 14,
      effect: "Light wind that rustles leaves and can be felt on the face. No mechanical effects."
    },
    "Windy": { // 15-25 mph
      min: 15,
      max: 25,
      effect: "Moderate wind that raises dust and loose paper. Small branches move. Flying creatures can still maneuver normally."
    },
    "Strong Winds": { // 26-39 mph
      min: 26,
      max: 39,
      effect: "Strong wind creates whistling sounds. Small trees sway. Flying creatures gain +10 movement speed when moving with the wind, and –10 movement speed when moving against it. All ranged weapon attacks have a –2 to attack rolls."
    },
    "Gale Force": { // 40-54 mph
      min: 40,
      max: 54,
      effect: "Large branches move, whistling is heard. Umbrellas are difficult to use. Flying creatures have disadvantage on Dexterity checks. Range for thrown weapons and projectiles is halved when shooting into the wind. Small flying creatures must make a DC 15 Strength check to fly against the wind."
    },
    "Storm Force": { // 55+ mph
      min: 55,
      max: 100,
      effect: "Whole trees move, walking is difficult. Range for thrown weapons and projectiles is halved. All creatures have disadvantage on Perception checks that rely on hearing. Flying creatures must succeed on a DC 20 Strength check to fly against the wind or be pushed back 10 feet at the end of their turn. Small flying creatures cannot fly against the wind."
    }
  };
  
  // Shooting Star and Meteor Impact Effects
  export const shootingStarEffects = {
    // Regular shooting star effect
    "Shooting Star": 
      "Shooting stars streak across the night sky. All creatures gain 1 luck point as per the Lucky feat, which lasts until used or the weather changes.",
    
    // Meteor impact effect (rare event with significant consequences)
    "Meteor Impact": 
      "A blazing meteor crashes to earth somewhere within 1d100 miles! The ground trembles from the impact, and a bright flash illuminates the horizon. Rumors will soon spread of strange materials, valuable metals, or even magical properties at the impact site. Those who investigate may find rare resources worth 2d6 × 100 gp, but beware of others seeking the same prize or strange effects near the impact zone."
  };