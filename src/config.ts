export type TEjectionConfig = {
    default: string | Partial<TDependencyEjectionConfig>;
} & {
    [partial: string]: Partial<TDependencyEjectionConfig>;
};

export type TDependencyEjectionConfig = {
    source: string;
    localSourcePrefix: string;
    destination?: string;
    destinationMap?: {
        [sourcePath: string]: string;
    };
};

const MOCK_CONFIG: TEjectionConfig = {
    default: {
        source: 'https://github.com/vikejs/vike-react/blob/main/packages/vike-react-chakra',
        // destination: `./ejected/${dependency}`,
    },
    wrapper: {
        source: 'https://github.com/vikejs/vike-react/blob/main/packages/vike-react-chakra/Wrapper.tsx',
        destination: 'src/pages/+Wrapper.tsx',
    },
};

const DEPENDENCY_SOURCE_DEFAULTS = {
    localSourcePrefix: './src',
};

export const getParsedDependencyConfigs = (
    dependency: string,
    dependencyPath: string,
    partial = 'default',
): TDependencyEjectionConfig => {
    const _configs = MOCK_CONFIG[partial];

    let configs = _configs;

    if (typeof configs === 'string') {
        configs = {
            source: configs,
        };
    }

    if (!configs) {
        throw new Error('Invalid partial');
    }

    if (!configs.source) {
        throw new Error('Source is required');
    }

    return {
        ...DEPENDENCY_SOURCE_DEFAULTS,
        destination: `./ejected/${dependency}`,
        ...configs,
    } as TDependencyEjectionConfig;
};

export const getPartialEjections = (
    dependency: string,
    dependencyPath: string,
) => {
    return Object.keys(MOCK_CONFIG);
};
