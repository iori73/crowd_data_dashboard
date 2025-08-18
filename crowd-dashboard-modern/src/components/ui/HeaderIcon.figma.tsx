import { figma } from '@figma/code-connect';
import { HeaderIcon } from './HeaderIcon';

figma.connect(
  HeaderIcon,
  'https://www.figma.com/design/JZgMqfnRACv3R611NwZ6JV/Data-Insight-Main-Components?node-id=1-145',
  {
    example: () => (
      <HeaderIcon size="md" />
    ),
  },
);