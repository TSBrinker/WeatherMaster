const fs = require('fs');

const filename = process.argv[2] || 'weather-test-results-4.json';
const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
console.log(`Analyzing: ${filename}\n`);

console.log('=== TEST RESULTS SUMMARY ===');
console.log('Total Tests:', data.totalTests.toLocaleString());
console.log('Successful Tests:', data.successfulTests.toLocaleString());
console.log('Total Anomalies:', data.anomalies.length.toLocaleString());
console.log('Success Rate:', ((data.successfulTests / data.totalTests) * 100).toFixed(2) + '%');
console.log('Failure Rate:', ((data.anomalies.length / data.totalTests) * 100).toFixed(2) + '%');
console.log('');

// Analyze anomalies by issue type
const issueTypes = {};
const biomeStats = {};

data.anomalies.forEach(anomaly => {
  // Track biome occurrences
  if (!biomeStats[anomaly.biome]) {
    biomeStats[anomaly.biome] = 0;
  }
  biomeStats[anomaly.biome]++;

  anomaly.issues.forEach(issue => {
    const match = issue.match(/(.*?) at (\d+)°F \(should be (.*?)\)/);
    if (match) {
      const [_, condition, temp, range] = match;
      const key = `${condition} - ${range}`;
      if (!issueTypes[key]) {
        issueTypes[key] = { count: 0, temps: [], biomes: new Set(), latitudeBands: new Set() };
      }
      issueTypes[key].count++;
      issueTypes[key].temps.push(parseInt(temp));
      issueTypes[key].biomes.add(anomaly.biome);
      if (anomaly.latitudeBand) {
        issueTypes[key].latitudeBands.add(anomaly.latitudeBand);
      }
    }
  });
});

console.log('=== ANOMALIES BY TYPE ===');
Object.entries(issueTypes)
  .sort((a, b) => b[1].count - a[1].count)
  .forEach(([type, info]) => {
    console.log('');
    console.log(`${type}:`);
    console.log(`  Count: ${info.count}`);
    console.log(`  Temperature range observed: ${Math.min(...info.temps)}°F - ${Math.max(...info.temps)}°F`);
    console.log(`  Expected range: ${type.split(' - ')[1]}`);
    console.log(`  Biomes affected (${info.biomes.size}): ${Array.from(info.biomes).join(', ')}`);
    if (info.latitudeBands.size > 0) {
      console.log(`  Latitude bands: ${Array.from(info.latitudeBands).join(', ')}`);
    }
  });

console.log('');
console.log('=== ANOMALIES BY BIOME ===');
Object.entries(biomeStats)
  .sort((a, b) => b[1] - a[1])
  .forEach(([biome, count]) => {
    console.log(`${biome}: ${count} anomalies`);
  });
