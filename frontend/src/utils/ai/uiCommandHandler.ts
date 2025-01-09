import { useUIStore } from '@/store/uiStateStore';
import { useRouter } from 'next/navigation';

export interface UICommand {
  type: 'NAVIGATE' | 'FILTER' | 'SEARCH' | 'RESET';
  payload: {
    page?: string;
    filter?: string;
    search?: string;
    priority?: string | null;
  };
}

class UICommandHandler {
  private router: any;

  constructor(router: any) {
    this.router = router;
  }

  async executeCommand(command: UICommand) {
    const store = useUIStore.getState();

    switch (command.type) {
      case 'NAVIGATE':
        if (command.payload.page) {
          this.router.push(command.payload.page);
          store.setCurrentPage(command.payload.page);
        }
        break;

      case 'FILTER':
        if (command.payload.filter) {
          store.setTaskFilter(command.payload.filter);
        }
        if (command.payload.priority !== undefined) {
          store.setSelectedPriority(command.payload.priority);
        }
        break;

      case 'SEARCH':
        if (command.payload.search !== undefined) {
          store.setSearchQuery(command.payload.search);
        }
        break;

      case 'RESET':
        store.resetFilters();
        break;

      default:
        console.warn('Unknown UI command type:', command.type);
    }
  }

  // Helper method to parse AI response into UI commands
  static parseAIResponse(response: any): UICommand[] {
    const commands: UICommand[] = [];
    console.log('AI response:', response);

    if (response.intent?.domain === 'tasks') {
      if (response.intent.intent === 'create_task') {
        commands.push({
          type: 'NAVIGATE',
          payload: { page: '/tasks/new' }
        });
      } else if (response.intent.intent === 'list_tasks') {
        commands.push({
          type: 'NAVIGATE',
          payload: { page: '/tasks' }
        });
      }
    }

    // Handle search queries
    if (response.search) {
      commands.push({
        type: 'SEARCH',
        payload: { search: response.search }
      });
    }

    // Handle filters
    if (response.filter) {
      commands.push({
        type: 'FILTER',
        payload: { 
          filter: response.filter,
          priority: response.priority || null
        }
      });
    }

    return commands;
  }
}

export default UICommandHandler;
