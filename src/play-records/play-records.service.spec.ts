import { Test, TestingModule } from '@nestjs/testing'
import { PlayRecordsService } from './play-records.service'

describe('PlayRecordsService', () => {
    let service: PlayRecordsService

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [PlayRecordsService]
        }).compile()

        service = module.get<PlayRecordsService>(PlayRecordsService)
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })
})
