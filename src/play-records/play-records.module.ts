import { Module } from '@nestjs/common'
import { PlayRecordsService } from './play-records.service'
import { PlayRecordsController } from './play-records.controller'

@Module({
    providers: [PlayRecordsService],
    controllers: [PlayRecordsController]
})
export class PlayRecordsModule {}
