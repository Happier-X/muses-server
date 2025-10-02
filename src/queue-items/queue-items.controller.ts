import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req
} from '@nestjs/common'
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

    @Post('add-all')
    addAllSongsToQueue(@Req() req: Request) {
        return this.queueItemsService.addAllSongsToQueue(req.user)
    }

    @Get('')
    getPlayQueue(@Req() req: Request) {
        return this.queueItemsService.getPlayQueue(req.user)
    }

    @Get('next')
    getNextQueueItem(
        @Query('currentSongId')
        currentSongId: string,
        @Req() req: Request
    ) {
        return this.queueItemsService.getNextQueueItem(
            Number(currentSongId),
            req.user
        )
    }

    @Get('previous')
    getPreviousQueueItem(
        @Query('currentSongId')
        currentSongId: string,
        @Req() req: Request
    ) {
        return this.queueItemsService.getPreviousQueueItem(
            Number(currentSongId),
            req.user
        )
    }

    @Delete(':id')
    removeFromQueue(@Param('id') id: string, @Req() req: Request) {
        return this.queueItemsService.removeFromQueue(Number(id), req.user)
    }

    @Delete('')
    clearQueue(@Req() req: Request) {
        return this.queueItemsService.clearQueue(req.user)
    }

    @Patch(':id/position')
    updatePosition(
        @Param('id') id: string,
        @Body('newPosition') newPosition: number,
        @Req() req: Request
    ) {
        return this.queueItemsService.updatePosition(
            Number(id),
            newPosition,
            req.user
        )
    }

    @Post('shuffle')
    shuffleQueue(@Req() req: Request) {
        return this.queueItemsService.shuffleQueue(req.user)
    }

    @Post('restore-order')
    restoreOriginalOrder(@Req() req: Request) {
        return this.queueItemsService.restoreOriginalOrder(req.user)
    }
}
