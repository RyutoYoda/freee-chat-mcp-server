#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { FreeeClient } from "./freee-client.js";

// 環境変数を直接読み込み（dotenvを使わない）

const server = new Server(
  {
    name: "freee-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// アクセストークンは環境変数またはClaude Desktopの設定から取得
const accessToken = process.env.FREEE_ACCESS_TOKEN;
if (!accessToken) {
  throw new Error("FREEE_ACCESS_TOKEN environment variable is required");
}
const freeeClient = new FreeeClient(accessToken);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "suggest_company",
      description: "Get company suggestions based on user's preference. Ask user to choose which company to use if multiple companies exist.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "suggest_common_expenses",
      description: "Get suggestions for common expense categories and their typical tax codes for easy expense entry",
      inputSchema: {
        type: "object",
        properties: {
          company_id: {
            type: "number",
            description: "Company ID",
          },
        },
        required: ["company_id"],
      },
    },
    {
      name: "create_smart_expense",
      description: "Create expense with smart suggestions for account items and tax codes. Use this for easier expense creation.",
      inputSchema: {
        type: "object",
        properties: {
          company_id: {
            type: "number",
            description: "Company ID (use suggest_company first if unknown)",
          },
          amount: {
            type: "number",
            description: "Expense amount",
          },
          description: {
            type: "string",
            description: "Expense description",
          },
          transaction_date: {
            type: "string",
            description: "Transaction date (YYYY-MM-DD), defaults to today",
          },
          expense_type: {
            type: "string",
            enum: ["food", "office_supplies", "transportation", "utilities", "rent", "entertainment", "other"],
            description: "Type of expense for smart categorization. If not provided, will be auto-detected from description.",
          },
        },
        required: ["company_id", "amount", "description"],
      },
    },
    {
      name: "analyze_expense_type",
      description: "Analyze expense description to suggest the most appropriate expense type and account item",
      inputSchema: {
        type: "object",
        properties: {
          description: {
            type: "string",
            description: "Expense description (from receipt or user input)",
          },
        },
        required: ["description"],
      },
    },
    {
      name: "create_expense",
      description: "Create a new expense entry in freee",
      inputSchema: {
        type: "object",
        properties: {
          company_id: {
            type: "number",
            description: "Company ID",
          },
          amount: {
            type: "number",
            description: "Expense amount",
          },
          expense_application_line_template_id: {
            type: "number",
            description: "Expense category template ID",
          },
          description: {
            type: "string",
            description: "Expense description",
          },
          transaction_date: {
            type: "string",
            description: "Transaction date (YYYY-MM-DD)",
          },
        },
        required: ["company_id", "amount", "expense_application_line_template_id"],
      },
    },
    {
      name: "list_companies",
      description: "List all companies accessible by the user",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "list_expense_templates",
      description: "List expense application line templates",
      inputSchema: {
        type: "object",
        properties: {
          company_id: {
            type: "number",
            description: "Company ID",
          },
        },
        required: ["company_id"],
      },
    },
    {
      name: "list_deals",
      description: "List deals (income/expense transactions)",
      inputSchema: {
        type: "object",
        properties: {
          company_id: {
            type: "number",
            description: "Company ID",
          },
          type: {
            type: "string",
            enum: ["income", "expense"],
            description: "Deal type",
          },
          start_issue_date: {
            type: "string",
            description: "Start date for filtering (YYYY-MM-DD)",
          },
          end_issue_date: {
            type: "string",
            description: "End date for filtering (YYYY-MM-DD)",
          },
        },
        required: ["company_id"],
      },
    },
    {
      name: "create_deal",
      description: "Create a new deal (income/expense transaction)",
      inputSchema: {
        type: "object",
        properties: {
          company_id: {
            type: "number",
            description: "Company ID",
          },
          issue_date: {
            type: "string",
            description: "Issue date (YYYY-MM-DD)",
          },
          type: {
            type: "string",
            enum: ["income", "expense"],
            description: "Deal type",
          },
          partner_id: {
            type: "number",
            description: "Partner ID (optional)",
          },
          details: {
            type: "array",
            description: "Transaction details",
            items: {
              type: "object",
              properties: {
                account_item_id: {
                  type: "number",
                  description: "Account item ID",
                },
                tax_code: {
                  type: "number",
                  description: "Tax code",
                },
                amount: {
                  type: "number",
                  description: "Amount",
                },
                description: {
                  type: "string",
                  description: "Description",
                },
              },
              required: ["account_item_id", "tax_code", "amount"],
            },
          },
        },
        required: ["company_id", "issue_date", "type", "details"],
      },
    },
    {
      name: "list_account_items",
      description: "List account items (勘定科目)",
      inputSchema: {
        type: "object",
        properties: {
          company_id: {
            type: "number",
            description: "Company ID",
          },
        },
        required: ["company_id"],
      },
    },
    {
      name: "list_partners",
      description: "List partners (取引先)",
      inputSchema: {
        type: "object",
        properties: {
          company_id: {
            type: "number",
            description: "Company ID",
          },
        },
        required: ["company_id"],
      },
    },
    {
      name: "list_walletables",
      description: "List walletables (bank accounts/credit cards)",
      inputSchema: {
        type: "object",
        properties: {
          company_id: {
            type: "number",
            description: "Company ID",
          },
        },
        required: ["company_id"],
      },
    },
    {
      name: "list_taxes",
      description: "List tax codes",
      inputSchema: {
        type: "object",
        properties: {
          company_id: {
            type: "number",
            description: "Company ID",
          },
        },
        required: ["company_id"],
      },
    },
    {
      name: "delete_deal",
      description: "Delete a deal (income/expense transaction) by ID. Use this to correct mistakes.",
      inputSchema: {
        type: "object",
        properties: {
          company_id: {
            type: "number",
            description: "Company ID",
          },
          deal_id: {
            type: "number",
            description: "Deal ID to delete",
          },
        },
        required: ["company_id", "deal_id"],
      },
    },
    {
      name: "get_recent_deals",
      description: "Get recent deals to find deal IDs for deletion or review",
      inputSchema: {
        type: "object",
        properties: {
          company_id: {
            type: "number",
            description: "Company ID",
          },
          limit: {
            type: "number",
            description: "Number of recent deals to show (default: 10)",
          },
        },
        required: ["company_id"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    return {
      content: [
        {
          type: "text",
          text: "Error: No arguments provided",
        },
      ],
    };
  }

  try {
    switch (name) {
      case "suggest_company": {
        const companies = await freeeClient.listCompanies();
        const suggestion = freeeClient.suggestCompany(companies);
        return {
          content: [
            {
              type: "text",
              text: suggestion,
            },
          ],
        };
      }

      case "suggest_common_expenses": {
        const accountItems = await freeeClient.listAccountItems(args.company_id as number);
        const taxes = await freeeClient.listTaxes(args.company_id as number);
        const suggestions = freeeClient.suggestCommonExpenses(accountItems, taxes);
        return {
          content: [
            {
              type: "text",
              text: suggestions,
            },
          ],
        };
      }

      case "analyze_expense_type": {
        const analyzedType = freeeClient.analyzeExpenseFromDescription(args.description as string);
        return {
          content: [
            {
              type: "text",
              text: `**経費分析結果**\n\n**摘要:** ${args.description}\n**推奨経費種類:** ${analyzedType}\n\nこの分析結果を使って create_smart_expense で登録できます。`,
            },
          ],
        };
      }

      case "create_smart_expense": {
        const accountItems = await freeeClient.listAccountItems(args.company_id as number);
        const taxes = await freeeClient.listTaxes(args.company_id as number);
        
        // expense_typeが指定されていない場合は自動判断
        const expenseType = args.expense_type as string || freeeClient.analyzeExpenseFromDescription(args.description as string);
        
        const smartMapping = freeeClient.getSmartExpenseMapping(
          expenseType,
          accountItems,
          taxes
        );
        
        const result = await freeeClient.createDeal(
          args.company_id as number,
          args.transaction_date as string || new Date().toISOString().split("T")[0],
          "expense",
          [{
            account_item_id: smartMapping.accountItemId,
            tax_code: smartMapping.taxCode,
            amount: args.amount as number,
            description: args.description as string,
          }]
        );
        
        return {
          content: [
            {
              type: "text",
              text: `経費登録完了！\n\n**詳細:**\n- 金額: ¥${args.amount?.toLocaleString()}\n- 勘定科目: ${smartMapping.accountItemName}\n- 税区分: ${smartMapping.taxName}\n- 経費種類: ${expenseType} ${args.expense_type ? '(指定)' : '(自動判定)'}\n- 摘要: ${args.description}\n- 取引日: ${args.transaction_date || new Date().toISOString().split("T")[0]}\n\n**取引ID:** ${result.deal?.id}\n\n${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      }

      case "create_expense": {
        const result = await freeeClient.createExpense(
          args.company_id as number,
          args.amount as number,
          args.expense_application_line_template_id as number,
          args.description as string,
          args.transaction_date as string
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "list_companies": {
        const result = await freeeClient.listCompanies();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "list_expense_templates": {
        const result = await freeeClient.listExpenseTemplates(args.company_id as number);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "list_deals": {
        const result = await freeeClient.listDeals(
          args.company_id as number,
          args.type as "income" | "expense" | undefined,
          args.start_issue_date as string | undefined,
          args.end_issue_date as string | undefined
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "create_deal": {
        const result = await freeeClient.createDeal(
          args.company_id as number,
          args.issue_date as string,
          args.type as "income" | "expense",
          args.details as any[],
          args.partner_id as number | undefined
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "list_account_items": {
        const result = await freeeClient.listAccountItems(args.company_id as number);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "list_partners": {
        const result = await freeeClient.listPartners(args.company_id as number);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "list_walletables": {
        const result = await freeeClient.listWalletables(args.company_id as number);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "list_taxes": {
        const result = await freeeClient.listTaxes(args.company_id as number);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "delete_deal": {
        const result = await freeeClient.deleteDeal(
          args.company_id as number,
          args.deal_id as number
        );
        return {
          content: [
            {
              type: "text",
              text: `**取引が削除されました**\n\n**削除された取引ID:** ${args.deal_id}\n\n${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      }

      case "get_recent_deals": {
        const result = await freeeClient.getRecentDeals(
          args.company_id as number,
          args.limit as number || 10
        );
        return {
          content: [
            {
              type: "text",
              text: freeeClient.formatRecentDeals(result),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});