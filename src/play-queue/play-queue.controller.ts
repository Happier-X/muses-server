import { Body, Controller, Get, Post, Req } from '@nestjs/common'
import { Request } from 'express'
import { PlayQueueService } from './play-queue.service'

@Controller('play-queue')
export class PlayQueueController {
    constructor(private readonly playQueueService: PlayQueueService) {}

    @Post('add')
    addToPlayQueue(
        @Body('songIdList') songIdList: string[],
        @Req() req: Request
    ) {
        return this.playQueueService.addToPlayQueue(songIdList, req.user)
    }

    @Get('get')
    getPlayQueue(@Req() req: Request) {
        return this.playQueueService.getPlayQueue(req.user)
    }
}
