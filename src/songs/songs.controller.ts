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
    getStreamById(@Query('id') id: string) {
        return this.songsService.getStreamById(Number(id))
    }

    @Get('')
    getSongs(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('size', new DefaultValuePipe(20), ParseIntPipe) size: number
    ) {
        return this.songsService.getSongs(page, size)
    }

    // @Post('play-count')
    // addPlayCount(@Body('id') id: string) {
    //     return this.songsService.addPlayCount(Number(id))
    // }

    // @Get('minPlayCountSong')
    // getMinPlayCountSong(@Query('ids') ids: string) {
    //     return this.songsService.getMinPlayCountSong(ids)
    // }

    @Get('detail')
    getSongDetail(@Query('songId') songId: string) {
        return this.songsService.getSongDetail(Number(songId))
    }
}
