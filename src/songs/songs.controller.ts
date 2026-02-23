import {
    Controller,
    Get,
    Post,
    Query,
    Body,
    ParseIntPipe,
    DefaultValuePipe
} from '@nestjs/common'
import { SongsService } from './songs.service'

@Controller('songs')
export class SongsController {
    constructor(private readonly songsService: SongsService) {}

    @Post('scan')
    scanAllSongs(@Body('scanAll') scanAll: boolean) {
        return this.songsService.scanAllSongs(scanAll)
    }

    @Get('stream')
    getSongStream(@Query('songId') songId: string) {
        return this.songsService.getSongStream(songId)
    }

    @Get('')
    getSongs(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('size', new DefaultValuePipe(20), ParseIntPipe) size: number
    ) {
        return this.songsService.getSongs(page, size)
    }

    @Get('detail')
    getSongDetail(@Query('songId') songId: string) {
        return this.songsService.getSongDetail(songId)
    }
}
