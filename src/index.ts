#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { TokenManager } from './auth/token.js';
import { CoreTools } from './tools/core.js';
import { TimeTools } from './tools/time.js';
import { Config } from './types/common.js';
import {
  EmployeeDetails,
  EmployeeUpdate,
  EmployeeHistory,
  PersonalDocs,
  PositionMaster,
  FormsData,
  SeparationDetails,
  AddEmployee,
  DeactivateEmployee,
  ProfileAttachment,
} from './types/core.js';
import {
  MonthlyAttendance,
  DailyAttendance,
  AttendanceRoster,
  AttendancePunch,
  BackdatedAttendance,
  LeaveAction,
  LeaveActionHistory,
  HolidayList,
  LeaveBalance,
  ImportLeave,
} from './types/time.js';

// Environment variables from MCP server configuration
const config: Config = {
  domain: process.env.DARWINBOX_DOMAIN || '',
  clientId: process.env.DARWINBOX_CLIENT_ID || '',
  clientSecret: process.env.DARWINBOX_CLIENT_SECRET || '',
  grantType: process.env.DARWINBOX_GRANT_TYPE || '',
  code: process.env.DARWINBOX_CODE || '',
  datasetKey: process.env.DARWINBOX_DATASET_KEY || '',
};

if (!config.domain || !config.clientId || !config.clientSecret || !config.grantType || !config.code || !config.datasetKey) {
  throw new Error('Required environment variables are missing');
}

class DarwinboxServer {
  private server: Server;
  private tokenManager: TokenManager;
  private coreTools: CoreTools;
  private timeTools: TimeTools;

  constructor() {
    this.server = new Server(
      {
        name: 'darwinbox-mcp',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.tokenManager = new TokenManager(config);
    this.coreTools = new CoreTools(this.tokenManager, config.datasetKey);
    this.timeTools = new TimeTools(this.tokenManager);

    this.setupToolHandlers();
    
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Core Tools
        {
          name: 'get_employee_details',
          description: 'Get employee details with various filters',
          inputSchema: {
            type: 'object',
            properties: {
              employee_ids: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of employee IDs to fetch specific employees',
              },
              last_modified: {
                type: 'string',
                description: 'Fetch employees modified after this date (DD-MM-YYYY HH:mm:ss)',
              },
              employee_no: {
                type: 'string',
                description: 'Single employee number to fetch',
              },
            },
            oneOf: [
              { required: [] }, // fetch all employees
              { required: ['employee_ids'] }, // fetch specific employees
              { required: ['last_modified'] }, // fetch changed employees
              { required: ['employee_no'] }, // fetch single employee
            ],
          },
        },
        // ... other tool definitions remain the same
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (!args) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'Missing required arguments'
        );
      }

      try {
        let result;

        // Core Tools
        if (name === 'get_employee_details') {
          result = await this.coreTools.getEmployeeDetails(args as unknown as Partial<EmployeeDetails>);
        } else if (name === 'update_employee') {
          result = await this.coreTools.updateEmployee(args as unknown as EmployeeUpdate);
        } else if (name === 'get_employee_history') {
          result = await this.coreTools.getEmployeeHistory(args as unknown as EmployeeHistory);
        } else if (name === 'download_personal_docs') {
          result = await this.coreTools.downloadPersonalDocs(args as unknown as PersonalDocs);
        } else if (name === 'get_position_master') {
          result = await this.coreTools.getPositionMaster(args as unknown as PositionMaster);
        } else if (name === 'get_forms_data') {
          result = await this.coreTools.getFormsData(args as unknown as FormsData);
        } else if (name === 'get_separation_details') {
          result = await this.coreTools.getSeparationDetails(args as unknown as SeparationDetails);
        } else if (name === 'add_employee') {
          result = await this.coreTools.addEmployee(args as unknown as AddEmployee);
        } else if (name === 'deactivate_employee') {
          result = await this.coreTools.deactivateEmployee(args as unknown as DeactivateEmployee);
        } else if (name === 'upload_profile_attachments') {
          result = await this.coreTools.uploadProfileAttachments(args as unknown as ProfileAttachment);
        }
        // Time Management Tools
        else if (name === 'get_monthly_attendance') {
          result = await this.timeTools.getMonthlyAttendance(args as unknown as MonthlyAttendance);
        } else if (name === 'get_daily_attendance') {
          result = await this.timeTools.getDailyAttendance(args as unknown as DailyAttendance);
        } else if (name === 'get_attendance_roster') {
          result = await this.timeTools.getAttendanceRoster(args as unknown as AttendanceRoster);
        } else if (name === 'record_attendance_punches') {
          result = await this.timeTools.recordAttendancePunches(args as unknown as AttendancePunch);
        } else if (name === 'record_backdated_attendance') {
          result = await this.timeTools.recordBackdatedAttendance(args as unknown as BackdatedAttendance);
        } else if (name === 'approve_leave') {
          result = await this.timeTools.approveLeave(args as unknown as LeaveAction);
        } else if (name === 'get_leave_action_history') {
          result = await this.timeTools.getLeaveActionHistory(args as unknown as LeaveActionHistory);
        } else if (name === 'get_holiday_list') {
          result = await this.timeTools.getHolidayList(args as unknown as HolidayList);
        } else if (name === 'get_leave_balance') {
          result = await this.timeTools.getLeaveBalance(args as unknown as LeaveBalance);
        } else if (name === 'import_leave') {
          result = await this.timeTools.importLeave(args as unknown as ImportLeave);
        } else {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${name}`
          );
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: unknown) {
        if (error instanceof McpError) {
          throw error;
        }
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${errorMessage}`
        );
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Darwinbox MCP server running on stdio');
  }
}

const server = new DarwinboxServer();
server.run().catch(console.error);
