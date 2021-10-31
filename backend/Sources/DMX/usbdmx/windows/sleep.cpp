#ifdef _WIN32

#include <windows.h>

void sleep(int seconds) {
    Sleep(seconds*1000);
}

#endif
