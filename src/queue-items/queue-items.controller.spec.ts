import { Test, TestingModule } from '@nestjs/testing'
import { QueueItemsController } from './queue-items.controller'

describe('PlayQueueController', () => {
    let controller: QueueItemsController

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [QueueItemsController]
        }).compile()

        controller = module.get<QueueItemsController>(QueueItemsController)
    })

    it('should be defined', () => {
        expect(controller).toBeDefined()
    })
})
