import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

// Small SVG heatmap: bars per muscle colored by volume
export default function MuscleHeatMap({ muscleCounts = {} }) {
  const muscles = Object.keys(muscleCounts).sort((a,b)=>muscleCounts[b]-muscleCounts[a]);
  if (muscles.length === 0) return (
    <View style={{ padding: 8 }}><Text style={{ fontWeight: '600' }}>Muscle Heat Map</Text><Text style={{ marginTop: 8 }}>No data yet</Text></View>
  );

  const values = muscles.map(m => muscleCounts[m] || 0);
  const max = Math.max(...values, 1);
  const width = 300; const height = muscles.length * 24 + 20;

  return (
    <View style={{ padding: 8 }}>
      <Text style={{ fontWeight: '600' }}>Muscle Heat Map</Text>
      <Svg width={width} height={height} style={{ marginTop: 8 }}>
        {muscles.map((m, i) => {
          const v = muscleCounts[m] || 0;
          const barW = Math.round((v / max) * (width - 120));
          const colorIntensity = Math.round((v / max) * 200) + 40;
          const fill = `rgb(${255 - colorIntensity},${100 + colorIntensity/2},80)`;
          return (
            <React.Fragment key={m}>
              <SvgText x={4} y={16 + i*24} fontSize="12" fill="#222">{m}</SvgText>
              <Rect x={110} y={4 + i*24} width={barW} height={16} fill={fill} rx={4} />
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}
