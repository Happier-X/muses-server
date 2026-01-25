import { Controller, Post, Body, Req } from '@nestjs/common'
import { Request } from 'express'
import { PlayRecordsService } from './play-records.service'

@Controller('play-records')
export class PlayRecordsController {
    constructor(private readonly playRecordsService: PlayRecordsService) {}
    @Post('')
    addPlayRecord(@Body('songId') songId: string, @Req() req: Request) {
        return this.playRecordsService.addPlayRecord(Number(songId), req.user)
    }
}
