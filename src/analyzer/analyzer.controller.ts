import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { AnalyzerService } from './analyzer.service';

@Controller('analyzer')
export class AnalyzerController {
    constructor(private readonly analyzerService: AnalyzerService){}

    @Post('scan')
    async scanRepo(@Body('url') url: string) {
        if(!url) {
            throw new BadRequestException("L'URL du repository Github est requise")
        }

        try{
            const parts = url.replace('https://github.com/', '').split('/');
            const owner = parts[0];
            const repo = parts[1];

            if(!owner || !repo) {
                throw new BadRequestException("Format d'URL invalide")
            }

            return await this.analyzerService.analyzeRepo(owner, repo);
        } catch(err) {
            console.log(err);
            throw new BadRequestException("Erreur lors de l'analyse du repo: " + err);
        }
    }
}
