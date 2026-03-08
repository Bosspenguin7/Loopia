import crypto from "crypto";
import { ethers } from "ethers";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getEncryptionKey(): Buffer {
    const hex = process.env.WALLET_ENCRYPTION_KEY;
    if (!hex || hex.length !== 64) {
        throw new Error("WALLET_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)");
    }
    return Buffer.from(hex, "hex");
}

export function encryptPrivateKey(privateKey: string): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(privateKey, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();
    // Format: iv:authTag:ciphertext (all hex)
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptPrivateKey(encryptedData: string): string {
    const key = getEncryptionKey();
    const [ivHex, authTagHex, ciphertextHex] = encryptedData.split(":");
    if (!ivHex || !authTagHex || !ciphertextHex) {
        throw new Error("Invalid encrypted data format");
    }
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const ciphertext = Buffer.from(ciphertextHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString("utf8");
}

export function generateWallet(): { address: string; encryptedKey: string } {
    const wallet = ethers.Wallet.createRandom();
    const encryptedKey = encryptPrivateKey(wallet.privateKey);
    return { address: wallet.address, encryptedKey };
}

export async function getAvaxBalance(address: string): Promise<string> {
    const rpcUrl = process.env.AVAX_RPC_URL;
    if (!rpcUrl) throw new Error("AVAX_RPC_URL is not set in .env");
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const balanceWei = await provider.getBalance(address);
    return ethers.formatEther(balanceWei);
}

export async function getGasPrice(): Promise<string> {
    const rpcUrl = process.env.AVAX_RPC_URL;
    if (!rpcUrl) throw new Error("AVAX_RPC_URL is not set in .env");
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const feeData = await provider.getFeeData();
    return (feeData.gasPrice ?? 0n).toString();
}

export async function sendAvax(
    fromAddress: string,
    encryptedKey: string,
    toAddress: string,
    amountAvax: string
): Promise<{ txHash: string; snowtraceUrl: string }> {
    const rpcUrl = process.env.AVAX_RPC_URL;
    if (!rpcUrl) throw new Error("AVAX_RPC_URL is not set in .env");

    if (!ethers.isAddress(toAddress)) {
        throw new Error("Invalid destination address");
    }

    const privateKey = decryptPrivateKey(encryptedKey);
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    const amountWei = ethers.parseEther(amountAvax);
    const balance = await provider.getBalance(fromAddress);

    if (balance < amountWei) {
        throw new Error("Insufficient AVAX balance");
    }

    const tx = await wallet.sendTransaction({
        to: toAddress,
        value: amountWei,
    });

    const receipt = await tx.wait();
    const txHash = receipt!.hash;

    console.log(`[Wallet] Withdraw: ${fromAddress} -> ${toAddress} ${amountAvax} AVAX tx=${txHash}`);

    return {
        txHash,
        snowtraceUrl: `https://testnet.snowtrace.io/tx/${txHash}`,
    };
}
