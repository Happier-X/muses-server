import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import {
    FastifyAdapter,
    NestFastifyApplication
} from '@nestjs/platform-fastify'
import { resolve } from 'path'

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter()
    )
    app.useStaticAssets({ root: resolve(process.cwd(), 'public') })
    await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
