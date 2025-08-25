import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { SongsModule } from './songs/songs.module'
import { UtilsModule } from './utils/utils.module'
import { QueueItemsModule } from './queue-items/queue-items.module'
import { PlayRecordsModule } from './play-records/play-records.module'

@Module({
    imports: [
        ConfigModule.forRoot(),
        PrismaModule,
        AuthModule,
        UsersModule,
        SongsModule,
        UtilsModule,
        QueueItemsModule,
        PlayRecordsModule
    ],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule {}
