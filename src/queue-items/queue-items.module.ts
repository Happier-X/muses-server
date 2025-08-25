import { Module } from '@nestjs/common'
import { QueueItemsController } from './queue-items.controller'
import { QueueItemsService } from './queue-items.service'

@Module({
    controllers: [QueueItemsController],
    providers: [QueueItemsService]
})
export class QueueItemsModule {}
