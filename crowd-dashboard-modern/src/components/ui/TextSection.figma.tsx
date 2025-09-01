import { figma } from '@figma/code-connect';
import { TextSection } from './TextSection';

figma.connect(
  TextSection,
  'https://www.figma.com/design/JZgMqfnRACv3R611NwZ6JV/Data-Insight-Main-Components?node-id=1-25',
  {
    example: () => (
      <TextSection
        items={[
          {
            title: '平日の傾向',
            content: '夕方から夜にかけて人数が最も多くなります。平日のデータが強く反映されています。',
          },
          {
            title: '週末の傾向',
            content: '午前10時〜12時、夕方16時〜19時の2つのピークがあります。平日とは異なるパターンを示します。',
          },
        ]}
      />
    ),
  },
);