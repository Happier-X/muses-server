import { Test, TestingModule } from '@nestjs/testing'
import { PlayQueueController } from './play-queue.controller'

describe('PlayQueueController', () => {
    let controller: PlayQueueController

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PlayQueueController]
        }).compile()

        controller = module.get<PlayQueueController>(PlayQueueController)
    })

    it('should be defined', () => {
        expect(controller).toBeDefined()
    })
})
