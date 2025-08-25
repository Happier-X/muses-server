import { Test, TestingModule } from '@nestjs/testing'
import { PlayRecordsController } from './play-records.controller'

describe('PlayRecordsController', () => {
    let controller: PlayRecordsController

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PlayRecordsController]
        }).compile()

        controller = module.get<PlayRecordsController>(PlayRecordsController)
    })

    it('should be defined', () => {
        expect(controller).toBeDefined()
    })
})
