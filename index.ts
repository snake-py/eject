const packageManagers = {
    npm: Boolean(
        process.env.npm_config_user_agent &&
            process.env.npm_config_user_agent.includes('npm')
    ),
    yarn: Boolean(
        process.env.npm_config_user_agent &&
            process.env.npm_config_user_agent.includes('yarn')
    ),
    pnpm: Boolean(
        process.env.npm_config_user_agent &&
            process.env.npm_config_user_agent.includes('pnpm')
    ),
    bun: Boolean(process.versions.bun),
}
console.log(packageManagers)
