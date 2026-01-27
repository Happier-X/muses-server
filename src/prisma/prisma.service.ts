import {
    Injectable,
    OnModuleInit,
    OnModuleDestroy,
    Logger
} from '@nestjs/common'
import { PrismaClient } from '../generated/prisma/client'
import * as argon2 from 'argon2'
import { PrismaPg } from '@prisma/adapter-pg'

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy
{
    constructor() {
        const adapter = new PrismaPg({
            connectionString: process.env.DATABASE_URL as string
        })
        super({ adapter })
    }

    private readonly logger = new Logger(PrismaService.name)
    async onModuleInit() {
        await this.$connect()
        await this.checkAndInitializeDatabase()
    }

    async onModuleDestroy() {
        await this.$disconnect()
    }

    private async checkAndInitializeDatabase() {
        try {
            const userCount = await this.user.count()
            if (userCount === 0) {
                this.logger.log('数据库用户数据为空，正在创建默认管理员账户...')
                const adminPassword = await argon2.hash('admin123')
                await this.user.create({
                    data: {
                        username: 'admin',
                        password: adminPassword,
                        role: 'admin'
                    }
                })
                this.logger.log('默认管理员账户创建成功')
                this.logger.log('用户名: admin')
                this.logger.log('密码: admin123')
            } else {
                this.logger.log('数据库用户数据已存在，跳过默认管理员账户创建')
            }
        } catch (err) {
            this.logger.error('数据库初始化失败', err)
        }
    }
}
