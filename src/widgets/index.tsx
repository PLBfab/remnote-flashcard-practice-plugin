import { declareIndexPlugin, ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import '../style.css';
import '../App.css';

async function onActivate(plugin: ReactRNPlugin) {
  // Register settings
  await plugin.settings.registerStringSetting({
    id: 'documentIds',
    title: 'Document IDs (comma-separated)',
    defaultValue: '',
  });

  await plugin.settings.registerNumberSetting({
    id: 'cardCountPerDoc',
    title: 'Number of cards to select per document',
    defaultValue: 5,
  });

  await plugin.settings.registerNumberSetting({
    id: 'timeLimitPerCard',
    title: 'Time limit per card (seconds)',
    defaultValue: 60,
  });

  // A command to start the flashcard practice
  await plugin.app.registerCommand({
    id: 'start-flashcard-practice',
    name: 'Start Flashcard Practice',
    action: async () => {
      const documentIds = plugin.settings.getSetting<string>('documentIds').split(',').map(id => id.trim());
      const cardCountPerDoc = plugin.settings.getSetting<number>('cardCountPerDoc');
      const timeLimitPerCard = plugin.settings.getSetting<number>('timeLimitPerCard');

      // Here you need to implement the logic to fetch flashcards from documents
      // and start the practice
      // For simplicity, we just show a toast here
      await plugin.app.toast(`Starting flashcard practice with ${documentIds.length} documents, ${cardCountPerDoc} cards per document, and ${timeLimitPerCard} seconds per card.`);
    },
  });

  // Register a sidebar widget.
  await plugin.app.registerWidget('flashcard-practice-widget', WidgetLocation.RightSidebar, {
    dimensions: { height: 'auto', width: '100%' },
  });
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);