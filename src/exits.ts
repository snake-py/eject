export const exitCodes = {
    /** Common Shell defaults */
    OK: 0,
    MISUSE_OF_SHELL_BUILTINS: 1,
    COMMANDED_CANNOT_BE_INVOKED: 126,
    COMMAND_NOT_FOUND: 127,
    INVALID_ARGUMENT: 128,
    FATAL_ERROR: 128,
    /** MAX number can be 255 */
    /** Custom Exit Codes */
    GIT_NOT_INSTALLED: 129,
    GIT_HISTORY_NOT_CLEAN: 130,
};
