import { Body, Controller, Post, Body } from '@nestjs/common'

@Controller('play-queue')
export class PlayQueueController {
    @Post('add')
    addToPlayQueue(@Body('id') id: string) {
        return 'addToPlayQueue'
    }
}
