import apiClient from "@/lib/apiClient";
import type { Wallet, WalletInput } from "@/app/types";

export const walletService = {
  async getWallets(): Promise<Wallet[]> {
    const response = await apiClient.get<Wallet[]>("/wallets");
    return response.data;
  },

  async createWallet(input: WalletInput): Promise<Wallet> {
    const response = await apiClient.post<Wallet>("/wallets", input);
    return response.data;
  },

  async updateWallet(id: string, input: Partial<WalletInput>): Promise<Wallet> {
    const response = await apiClient.put<Wallet>(`/wallets/${id}`, input);
    return response.data;
  },

  async deleteWallet(id: string): Promise<void> {
    await apiClient.delete(`/wallets/${id}`);
  },
};
