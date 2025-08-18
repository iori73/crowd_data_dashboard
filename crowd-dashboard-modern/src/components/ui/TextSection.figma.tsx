import { figma } from '@figma/code-connect';
import { TextSection } from './TextSection';

figma.connect(
  TextSection,
  'https://www.figma.com/design/JZgMqfnRACv3R611NwZ6JV/Data-Insight-Main-Components?node-id=1-25',
  {
    example: () => (
      <TextSection
        title="時間帯"
        subtitle="時間別分析"
        content="時間帯のデータは1週間の平均のデータです。平日と休日では少しデータパターンが異なります。現在表示されているものは平日のデータが強く反映されたものです。"
        icon="clock"
        iconSize="md"
      />
    ),
  },
);