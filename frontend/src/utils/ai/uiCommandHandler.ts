import { useUIStore } from '@/store/uiStateStore';
import { useRouter } from 'next/navigation';

export interface UICommand {
  type: 'NAVIGATE' | 'FILTER' | 'SEARCH' | 'RESET';
  payload: {
    page?: string;
    filter?: {
      status?: string | null;
      priority?: string | null;
      due?: string | null;
      created?: string | null;
    };
    search?: string;
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
          // Handle filters if present in navigation payload
          if (command.payload.filter) {
            // Reset filters first
            store.resetFilters();
            
            // Apply new filters
            store.setTaskFilter(command.payload.filter);
          }
          this.router.push(command.payload.page);
          store.setCurrentPage(command.payload.page);
        }
        break;

      case 'FILTER':
        if (command.payload.filter) {
          store.setTaskFilter(command.payload.filter);
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
      if (response.intent.intent === 'create_task' || response.action === 'batch_operations') {
        commands.push({
          type: 'NAVIGATE',
          payload: { page: '/tasks' }
        });
      } else if (response.intent.intent === 'list_tasks') {
        commands.push({
          type: 'NAVIGATE',
          payload: { 
            page: '/tasks',
            filter: response.data?.filter || null
          }
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

    return commands;
  }
}

export default UICommandHandler;
