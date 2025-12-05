import {NextResponse} from 'next/server'
import {runAutonomousMatchingJob} from '@/jobs/autonomous-matching.job'
import {Logger} from '@/lib/utils/logger'

const logger = new Logger('CronAutonomousMatching')

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization')
    console.log(authHeader)
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401})
    }
    try {
        await runAutonomousMatchingJob()
        return NextResponse.json({success: true, message: 'Job completed'})
    } catch (error) {
        logger.error('Job failed', error as Error)
        return NextResponse.json({success: false}, {status: 500})
    }
}