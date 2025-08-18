import { figma } from '@figma/code-connect';
import { Legend } from './Legend';

figma.connect(
  Legend,
  'https://www.figma.com/design/JZgMqfnRACv3R611NwZ6JV/Data-Insight-Main-Components?node-id=1-113',
  {
    example: () => (
      <Legend
        items={[
          { color: '#FF5E5E', label: 'ピーク', width: 'lg' },
          { color: 'white', label: '10人未満', width: 'md' }
        ]}
        backgroundColor="#F4F4F5"
      />
    ),
  },
);