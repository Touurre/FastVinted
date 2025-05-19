import { Injectable, type CanActivate, type ExecutionContext, UnauthorizedException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { Observable } from "rxjs"

@Injectable()
export class PythonApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest()
    const apiKey = request.headers["x-api-key"]
    const validApiKey = this.configService.get<string>("PYTHON_API_KEY")

    if (!apiKey || apiKey !== validApiKey) {
      throw new UnauthorizedException("Invalid API key")
    }

    return true
  }
}
