import axios, { AxiosInstance } from "axios";

export class FreeeClient {
  private api: AxiosInstance;

  constructor(accessToken: string) {
    this.api = axios.create({
      baseURL: "https://api.freee.co.jp",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  async listCompanies() {
    const response = await this.api.get("/api/1/companies");
    return response.data;
  }

  async listExpenseTemplates(companyId: number) {
    const response = await this.api.get("/api/1/expense_application_line_templates", {
      params: { company_id: companyId },
    });
    return response.data;
  }

  async createExpense(
    companyId: number,
    amount: number,
    expenseApplicationLineTemplateId: number,
    description?: string,
    transactionDate?: string
  ) {
    const response = await this.api.post("/api/1/expense_applications", {
      company_id: companyId,
      title: description || `経費申請 ${new Date().toISOString().split("T")[0]}`,
      expense_application_lines: [
        {
          expense_application_line_template_id: expenseApplicationLineTemplateId,
          amount,
          description,
          transaction_date: transactionDate || new Date().toISOString().split("T")[0],
        },
      ],
    });
    return response.data;
  }

  async listDeals(
    companyId: number,
    type?: "income" | "expense",
    startIssueDate?: string,
    endIssueDate?: string
  ) {
    const response = await this.api.get("/api/1/deals", {
      params: {
        company_id: companyId,
        type,
        start_issue_date: startIssueDate,
        end_issue_date: endIssueDate,
      },
    });
    return response.data;
  }

  async createDeal(
    companyId: number,
    issueDate: string,
    type: "income" | "expense",
    details: Array<{
      account_item_id: number;
      tax_code: number;
      amount: number;
      description?: string;
    }>,
    partnerId?: number
  ) {
    const response = await this.api.post("/api/1/deals", {
      company_id: companyId,
      issue_date: issueDate,
      type,
      partner_id: partnerId,
      details,
    });
    return response.data;
  }

  async listAccountItems(companyId: number) {
    const response = await this.api.get("/api/1/account_items", {
      params: { company_id: companyId },
    });
    return response.data;
  }

  async listPartners(companyId: number) {
    const response = await this.api.get("/api/1/partners", {
      params: { company_id: companyId },
    });
    return response.data;
  }

  async listWalletables(companyId: number) {
    const response = await this.api.get("/api/1/walletables", {
      params: { company_id: companyId },
    });
    return response.data;
  }

  async listTaxes(companyId: number) {
    const response = await this.api.get(`/api/1/taxes/companies/${companyId}`);
    return response.data;
  }

  // スマート機能
  suggestCompany(companies: any): string {
    if (!companies?.companies || companies.companies.length === 0) {
      return "❌ アクセス可能な会社が見つかりませんでした。";
    }

    if (companies.companies.length === 1) {
      const company = companies.companies[0];
      return `✅ **会社が自動選択されました**\n\n🏢 **${company.display_name}** (ID: ${company.id})\n- 権限: ${company.role}\n\nこの会社で経費登録を行います。`;
    }

    let suggestion = "🏢 **複数の会社が見つかりました。どちらを使用しますか？**\n\n";
    companies.companies.forEach((company: any, index: number) => {
      suggestion += `${index + 1}. **${company.display_name}** (ID: ${company.id})\n   - 権限: ${company.role}\n   - 会社番号: ${company.company_number}\n\n`;
    });
    
    suggestion += "💡 **使用する会社のIDを指定して経費登録してください。**";
    return suggestion;
  }

  suggestCommonExpenses(accountItems: any, taxes: any): string {
    const commonExpenseCategories = [
      { name: "交際費", keywords: ["交際費"], taxCodes: [136] },
      { name: "会議費", keywords: ["会議費"], taxCodes: [136] },
      { name: "旅費交通費", keywords: ["旅費交通費"], taxCodes: [136] },
      { name: "消耗品費", keywords: ["消耗品費", "事務用品費"], taxCodes: [136, 163] },
      { name: "通信費", keywords: ["通信費"], taxCodes: [136] },
      { name: "水道光熱費", keywords: ["水道光熱費"], taxCodes: [136] },
      { name: "地代家賃", keywords: ["地代家賃"], taxCodes: [136] },
      { name: "福利厚生費", keywords: ["福利厚生費"], taxCodes: [136] },
    ];

    let suggestion = "💼 **よく使う経費科目**\n\n";
    
    commonExpenseCategories.forEach((category, index) => {
      const matchedItem = accountItems.account_items?.find((item: any) => 
        category.keywords.some(keyword => item.name.includes(keyword))
      );
      
      if (matchedItem) {
        const taxInfo = taxes.taxes?.find((tax: any) => 
          category.taxCodes.includes(tax.code) && tax.available
        );
        
        suggestion += `${index + 1}. **${matchedItem.name}** (ID: ${matchedItem.id})\n`;
        if (taxInfo) {
          suggestion += `   - 推奨税区分: ${taxInfo.name_ja} (${taxInfo.code})\n`;
        }
        suggestion += `   - カテゴリ: ${matchedItem.account_category}\n\n`;
      }
    });

    suggestion += "💡 **create_smart_expense** を使うと、expense_type に基づいて自動で適切な勘定科目と税区分が選択されます。";
    return suggestion;
  }

  getSmartExpenseMapping(expenseType: string, accountItems: any, taxes: any) {
    const mappings: Record<string, { keywords: string[], defaultTaxCode: number }> = {
      food: { keywords: ["消耗品費", "事務用品費"], defaultTaxCode: 163 }, // 軽減税率8%
      office_supplies: { keywords: ["消耗品費", "事務用品費"], defaultTaxCode: 136 }, // 10%
      transportation: { keywords: ["旅費交通費"], defaultTaxCode: 136 },
      utilities: { keywords: ["水道光熱費"], defaultTaxCode: 136 },
      rent: { keywords: ["地代家賃"], defaultTaxCode: 136 },
      entertainment: { keywords: ["交際費", "会議費"], defaultTaxCode: 136 },
      other: { keywords: ["雑費", "消耗品費"], defaultTaxCode: 136 },
    };

    const mapping = mappings[expenseType] || mappings.other;
    
    // 勘定科目を検索
    const accountItem = accountItems.account_items?.find((item: any) => 
      mapping.keywords.some(keyword => item.name.includes(keyword)) && item.available
    ) || accountItems.account_items?.find((item: any) => item.available);

    // 税区分を検索
    const tax = taxes.taxes?.find((tax: any) => 
      tax.code === mapping.defaultTaxCode && tax.available
    ) || taxes.taxes?.find((tax: any) => tax.available);

    return {
      accountItemId: accountItem?.id || null,
      accountItemName: accountItem?.name || "不明",
      taxCode: tax?.code || 2,
      taxName: tax?.name_ja || "対象外",
    };
  }

  // 削除・管理機能
  async deleteDeal(companyId: number, dealId: number) {
    const response = await this.api.delete(`/api/1/deals/${dealId}`, {
      params: { company_id: companyId },
    });
    return response.data;
  }

  async getRecentDeals(companyId: number, limit: number = 10) {
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    
    const response = await this.api.get("/api/1/deals", {
      params: {
        company_id: companyId,
        start_issue_date: startDate,
        end_issue_date: endDate,
        limit,
      },
    });
    return response.data;
  }

  formatRecentDeals(dealsData: any): string {
    if (!dealsData?.deals || dealsData.deals.length === 0) {
      return "📭 **最近の取引が見つかりませんでした**";
    }

    let formatted = "📋 **最近の取引一覧**\n\n";
    
    dealsData.deals.forEach((deal: any, index: number) => {
      formatted += `${index + 1}. **ID: ${deal.id}** | ¥${deal.amount?.toLocaleString()}\n`;
      formatted += `   - 日付: ${deal.issue_date}\n`;
      formatted += `   - 種類: ${deal.type === "expense" ? "支出" : "収入"}\n`;
      formatted += `   - 状態: ${deal.status === "settled" ? "決済済" : "未決済"}\n`;
      
      if (deal.details && deal.details.length > 0) {
        const firstDetail = deal.details[0];
        formatted += `   - 内容: ${firstDetail.description || "説明なし"}\n`;
      }
      
      formatted += "\n";
    });

    formatted += "💡 **削除したい場合:** `delete_deal` を使用して取引IDを指定してください。";
    return formatted;
  }
}