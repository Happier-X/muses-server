import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
    Req
} from '@nestjs/common'
import { Request } from 'express'
import { PlayQueueService } from './play-queue.service'

@Controller('play-queue')
export class PlayQueueController {
    constructor(private readonly playQueueService: PlayQueueService) {}

    @Post('')
    @HttpCode(HttpStatus.OK)
    addToPlayQueue(@Body('songIds') songIds: string, @Req() req: Request) {
        return this.playQueueService.addToPlayQueue(songIds, req.user)
    }

    @Post('add-all')
    @HttpCode(HttpStatus.OK)
    addAllSongsToQueue(@Req() req: Request) {
        return this.playQueueService.addAllSongsToQueue(req.user)
    }

    @Get('')
    getPlayQueue(@Req() req: Request) {
        return this.playQueueService.getPlayQueue(req.user)
    }

    @Get('next')
    getNextQueueItem(
        @Query('currentSongId')
        currentSongId: string,
        @Query('playMode')
        playMode: string,
        @Req() req: Request
    ) {
        return this.playQueueService.getNextQueueItem(
            Number(currentSongId),
            playMode,
            req.user
        )
    }

    @Get('previous')
    getPreviousQueueItem(
        @Query('currentSongId')
        currentSongId: string,
        @Query('playMode')
        playMode: string,
        @Req() req: Request
    ) {
        return this.playQueueService.getPreviousQueueItem(
            Number(currentSongId),
            playMode,
            req.user
        )
    }

    @Delete(':id')
    removeFromQueue(@Param('id') id: string, @Req() req: Request) {
        return this.playQueueService.removeFromQueue(Number(id), req.user)
    }

    @Delete('')
    clearQueue(@Req() req: Request) {
        return this.playQueueService.clearQueue(req.user)
    }

    @Patch(':id/position')
    updatePosition(
        @Param('id') id: string,
        @Body('newPosition') newPosition: number,
        @Req() req: Request
    ) {
        return this.playQueueService.updatePosition(
            Number(id),
            newPosition,
            req.user
        )
    }

    @Post('shuffle')
    shuffleQueue(@Req() req: Request) {
        return this.playQueueService.shuffleQueue(req.user)
    }
}
