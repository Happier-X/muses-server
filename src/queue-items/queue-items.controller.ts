import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common'
import { Request } from 'express'
import { QueueItemsService } from './queue-items.service'

@Controller('queue-items')
export class QueueItemsController {
    constructor(private readonly queueItemsService: QueueItemsService) {}

    @Post('')
    addToPlayQueue(
        @Body('songIdList') songIdList: string[],
        @Req() req: Request
    ) {
        return this.queueItemsService.addToPlayQueue(songIdList, req.user)
    }

    @Get('')
    getPlayQueue(@Req() req: Request) {
        return this.queueItemsService.getPlayQueue(req.user)
    }

    @Get('next')
    getNextQueueItem(
        @Query('currentQueueItemId')
        currentQueueItemId: string,
        @Query('playMode')
        playMode: string,
        @Req() req: Request
    ) {
        return this.queueItemsService.getNextQueueItem(
            Number(currentQueueItemId),
            playMode,
            req.user
        )
    }

    @Get('previous')
    getPreviousQueueItem(
        @Query('currentQueueItemId')
        currentQueueItemId: string,
        @Query('playMode')
        playMode: string,
        @Req() req: Request
    ) {
        return this.queueItemsService.getPreviousQueueItem(
            Number(currentQueueItemId),
            playMode,
            req.user
        )
    }
}
