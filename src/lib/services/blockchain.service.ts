import {Contract, ethers, Signer} from 'ethers'
import {Logger} from '@/lib/utils/logger'
import {BlockchainError, IBlockchainConfig, IDonationRecord,} from '@/types'

/**
 * BLOCKCHAIN SERVICE
 * Smart contract interactions and blockchain operations
 */

export class BlockchainService {
    private logger: Logger = new Logger('BlockchainService')
    private provider: ethers.Provider | null = null
    private signer: Signer | null = null
    private contract: Contract | null = null
    private tokenContract: Contract | null = null
    private config: IBlockchainConfig

    constructor(config?: IBlockchainConfig) {
        this.config = config || {
            rpcUrl: process.env.ETHEREUM_RPC_URL || '',
            privateKey: process.env.BLOCKCHAIN_SIGNER_PRIVATE_KEY || '',
            contractAddress: process.env.SMART_CONTRACT_ADDRESS || '',
            tokenAddress: process.env.REWARD_TOKEN_ADDRESS || '',
            chainId: parseInt(process.env.CHAIN_ID || '137'),
            gasLimit: 300000,
        }
    }

    /**
     * Initialize blockchain connection
     */
    async initialize(): Promise<void> {
        try {
            this.logger.info('Initializing blockchain connection...')

            // Create provider
            this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl)

            // Create signer
            this.signer = new ethers.Wallet(this.config.privateKey, this.provider)

            // Create contract instance
            const mainAbi = [
                'function recordDonationWithAutoVerification(uint256 requestId, address donor, uint26 unitsCollected, string memory ipfsProof, address[] memory verifiers, bytes[] memory signatures) external',
                'function createBloodRequest(string memory bloodType, uint256 unitsNeeded, uint256 urgencyLevel, string memory medicalProofIPFS, uint256 expirationTime) external',
                'function detectAndReportFraud(address user, string memory fraudType, address[] memory witnesses) external',
            ]

            this.contract = new ethers.Contract(
                this.config.contractAddress,
                mainAbi,
                this.signer
            )

            const tokenAbi = [
                'function transfer(address to, uint256 amount) external returns (bool)'
            ];

            this.tokenContract = new ethers.Contract(
                this.config.tokenAddress,
                tokenAbi,
                this.signer
            );

            // Verify connection
            const network = await this.provider.getNetwork()
            this.logger.info('Blockchain connected', {
                network: network.name,
                chainId: network.chainId,
            })
        } catch (error) {
            this.logger.error('Blockchain initialization failed', error as Error)
            throw new BlockchainError('Failed to initialize blockchain connection')
        }
    }

    /**
     * Transfer ERC-20 reward tokens to a user
     * @param toAddress The recipient's wallet address
     * @param amount The number of whole tokens to send
     * @returns Transaction hash
     */

    async transferTokens(toAddress: string, amount: number): Promise<string> {
        try {
            if (!this.tokenContract || !this.signer) {
                await this.initialize();
            }
            // Assuming the token uses 18 decimals, like most ERC-20 tokens
            // This converts "100" tokens to "100000000000000000000" (100 * 10^18)
            const txAmount = ethers.parseUnits(amount.toString(), 18);

            this.logger.info('Transferring reward tokens', {
                to: toAddress,
                amount: amount,
                amountWithDecimals: txAmount.toString()
            });

            const tx = await this.tokenContract!.transfer(
                toAddress,
                txAmount,
                {gasLimit: this.config.gasLimit}
            );

            const receipt = await tx.wait();
            const txHash = receipt?.hash || '';

            this.logger.info('Token transfer successful', {
                transactionHash: txHash,
            });

            return txHash;
        } catch (error) {
            this.logger.error('Failed to transfer tokens', error as Error);
            throw new BlockchainError('Failed to transfer reward tokens');
        }
    }


    /**
     * Record donation on blockchain
     */
    async recordDonation(
        donation: IDonationRecord,
        ipfsProof: string,
        signatures: string[]
    ): Promise<string> {
        try {
            if (!this.contract) {
                await this.initialize()
            }

            const {recordId, donor, unitsCollected, verifiers} = donation

            this.logger.info('Recording donation on blockchain', {
                requestId: recordId,
                donor,
                unitsCollected,
            })

            const tx = await this.contract!.recordDonationWithAutoVerification(
                recordId,
                donor,
                unitsCollected,
                ipfsProof,
                verifiers,
                signatures,
                {gasLimit: this.config.gasLimit}
            )

            const receipt = await tx.wait()

            this.logger.info('Donation recorded successfully', {
                transactionHash: receipt?.hash,
                blockNumber: receipt?.blockNumber,
            })

            return receipt?.hash || ''
        } catch (error) {
            this.logger.error('Failed to record donation', error as Error)
            throw new BlockchainError('Failed to record donation on blockchain')
        }
    }

    /**
     * Create blood request on blockchain
     */
    async createBloodRequest(
        bloodType: string,
        unitsNeeded: number,
        urgencyLevel: number,
        medicalProofIPFS: string,
        expirationTime: number
    ): Promise<string> {
        try {
            if (!this.contract) {
                await this.initialize()
            }

            this.logger.info('Creating blood request on blockchain', {
                bloodType,
                unitsNeeded,
            })

            const tx = await this.contract!.createBloodRequest(
                bloodType,
                unitsNeeded,
                urgencyLevel,
                medicalProofIPFS,
                expirationTime,
                {gasLimit: this.config.gasLimit}
            )

            const receipt = await tx.wait()

            this.logger.info('Blood request created on blockchain', {
                transactionHash: receipt?.hash,
            })

            return receipt?.hash || ''
        } catch (error) {
            this.logger.error('Failed to create blood request', error as Error)
            throw new BlockchainError('Failed to create blood request on blockchain')
        }
    }

    /**
     * Sign data for multi-signature verification
     */
    signData(data: string): string {
        try {
            if (!this.signer || !(this.signer instanceof ethers.Wallet)) {
                throw new BlockchainError('Signer not initialized')
            }

            const messageHash = ethers.id(data)

            // Use `new` for ethers v6
            const signingKey = new ethers.SigningKey(this.config.privateKey);
            const signature = signingKey.sign(messageHash);

            return ethers.Signature.from(signature).serialized
        } catch (error) {
            this.logger.error('Failed to sign data', error as Error)
            throw new BlockchainError('Failed to sign data')
        }
    }

    /**
     * Verify multiple signatures
     */
    verifySignatures(
        data: string,
        signatures: string[],
        signers: string[]
    ): boolean {
        try {
            if (signatures.length !== signers.length) {
                return false
            }

            const messageHash = ethers.id(data)

            for (let i = 0; i < signatures.length; i++) {
                const recoveredAddress = ethers.recoverAddress(
                    messageHash,
                    signatures[i]
                )
                if (recoveredAddress.toLowerCase() !== signers[i].toLowerCase()) {
                    return false
                }
            }

            return true
        } catch (error) {
            this.logger.error('Signature verification failed', error as Error)
            return false
        }
    }

    /**
     * Get donor reputation from blockchain
     */
    async getDonorReputation(donorAddress: string): Promise<number> {
        try {
            if (!this.provider) {
                await this.initialize()
            }

            // This would call a view function on the contract
            // For now, returning mock data
            // return 500 // Mock reputation score

            // In production:
            return await this.contract!.getDonorProfile(donorAddress)
        } catch (error) { // <<< THIS BRACE WAS MISSING
            this.logger.error('Failed to get donor reputation', error as Error)
            throw new BlockchainError('Failed to get donor reputation')
        }
    }

    /**
     * Report fraud on blockchain
     */
    async reportFraud(
        user: string,
        fraudType: string,
        witnesses: string[]
    ): Promise<string> {
        try {
            if (!this.contract) {
                await this.initialize()
            }

            this.logger.info('Reporting fraud on blockchain', {
                user,
                fraudType,
                witnessCount: witnesses.length,
            })

            const tx = await this.contract!.detectAndReportFraud(
                user,
                fraudType,
                witnesses,
                {gasLimit: this.config.gasLimit}
            )

            const receipt = await tx.wait()

            this.logger.info('Fraud reported successfully', {
                transactionHash: receipt?.hash,
            })

            return receipt?.hash || ''
        } catch (error) {
            this.logger.error('Failed to report fraud', error as Error)
            throw new BlockchainError('Failed to report fraud')
        }
    }
}

// Export a single instance to be used across your app
export const blockchainService = new BlockchainService()