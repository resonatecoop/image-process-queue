#!/usr/bin/env node

import yargs from 'yargs'
import { Worker } from 'bullmq'
import winston from 'winston'
import optimizeImageJob from './job'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'image-processing' },
  transports: [
    new winston.transports.Console({
      level: 'debug',
      format: winston.format.simple()
    }),
    new winston.transports.File({
      filename: 'error.log',
      level: 'error'
    })
  ]
})

const workerOptions = {
  prefix: 'justifay',
  connection: {
    port: process.env.REDIS_PORT || 6379,
    host: process.env.REDIS_HOST || '127.0.0.1',
    password: process.env.REDIS_PASSWORD
  }
}

yargs // eslint-disable-line
  .command('run [name]', 'starts image processing worker', (yargs) => {
    yargs
      .positional('name', {
        type: 'string',
        describe: 'worker name',
        default: 'convert'
      })
  }, (argv) => {
    const worker = new Worker(argv.name, optimizeImageJob, workerOptions)

    worker.on('error', (err) => {
      logger.error(err)
    })

    worker.on('failed', (job, err) => {
      logger.error(err)
    })

    worker.on('paused', () => {
      logger.info('job paused')
    })

    worker.on('resumed', (job) => {
      logger.info('job resumed')
    })

    worker.on('cleaned', (jobs, type) => {
      logger.info('job cleaned')
    })

    worker.on('drained', () => {
      logger.info('job drained')
    })

    worker.on('removed', (job) => {
      logger.info('job removed')
    })
  })
  .help()
  .argv
