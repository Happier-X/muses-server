import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common'
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

    @Get('list')
    getSongsList() {
        return this.songsService.getSongsList()
    }

    @Post('addPlayCount')
    addPlayCount(@Body('id') id: string) {
        return this.songsService.addPlayCount(Number(id))
    }

    @Get('minPlayCountSong')
    getMinPlayCountSong(@Query('ids') ids: string) {
        return this.songsService.getMinPlayCountSong(ids)
    }

    @Get('detail')
    getSongDetail(@Query('id') id: string) {
        return this.songsService.getSongDetail(Number(id))
    }
}
