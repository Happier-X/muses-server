import { Module } from '@nestjs/common'
import { PlayQueueController } from './play-queue.controller'
import { PlayQueueService } from './play-queue.service'

@Module({
    controllers: [PlayQueueController],
    providers: [PlayQueueService]
})
export class PlayQueueModule {}
