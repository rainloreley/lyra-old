#ifdef __cplusplus
extern "C" { 
#endif

#include <stdint.h>

#define DWORD uint32_t
#ifdef WIN32
    #define USB_DMX_DLL __declspec(dllexport) __stdcall
    #define USB_DMX_CALLBACK __stdcall
#else
    #define USB_DMX_DLL
    #define USB_DMX_CALLBACK
#endif


// types for library functions
typedef unsigned char FX5_TDMXArray[512];
typedef char FX5_TSERIAL[16];
typedef FX5_TSERIAL FX5_TSERIALLIST[32];
typedef void USB_DMX_CALLBACK (THOSTDEVICECHANGEPROC) (void);
typedef void USB_DMX_CALLBACK (THOSTINPUTCHANGEPROCBLOCK) (unsigned char blocknumber);


// define library functions
USB_DMX_DLL void FX5_GetAllConnectedInterfaces(FX5_TSERIALLIST* SerialList);
USB_DMX_DLL void FX5_GetAllOpenedInterfaces(FX5_TSERIALLIST* SerialList);
USB_DMX_DLL void FX5_SetDMX(FX5_TDMXArray* Array, int address, int value);
USB_DMX_DLL int FX5_GetDMX(FX5_TDMXArray* Array, int address);
USB_DMX_DLL DWORD FX5_OpenLink(FX5_TSERIAL* Serial, FX5_TDMXArray *DMXOutArray, FX5_TDMXArray *DMXInArray);
USB_DMX_DLL DWORD FX5_CloseLink (FX5_TSERIAL* Serial);
USB_DMX_DLL DWORD FX5_CloseAllLinks (void);
USB_DMX_DLL DWORD FX5_RegisterInterfaceChangeNotification (THOSTDEVICECHANGEPROC Proc);
USB_DMX_DLL DWORD FX5_UnregisterInterfaceChangeNotification (void);
USB_DMX_DLL DWORD FX5_RegisterInputChangeNotification (THOSTDEVICECHANGEPROC Proc);
USB_DMX_DLL DWORD FX5_UnregisterInputChangeNotification (void);

USB_DMX_DLL DWORD FX5_SetInterfaceMode (const FX5_TSERIAL *Serial, unsigned char Mode);
  // Modes:
  // 0: Do nothing - Standby
  // 1: DMX In -> DMX Out
  // 2: PC Out -> DMX Out
  // 3: DMX In + PC Out -> DMX Out
  // 4: DMX In -> PC In
  // 5: DMX In -> DMX Out & DMX In -> PC In
  // 6: PC Out -> DMX Out & DMX In -> PC In
  // 7: DMX In + PC Out -> DMX Out & DMX In -> PC In

USB_DMX_DLL DWORD FX5_GetDeviceVersion(FX5_TSERIAL Serial);
USB_DMX_DLL DWORD FX5_SetInterfaceAdvTxConfig(
											  FX5_TSERIAL Serial, unsigned char Control, uint16_t Breaktime, uint16_t Marktime,
    uint16_t Interbytetime, uint16_t Interframetime, uint16_t Channelcount, uint16_t Startbyte
);
USB_DMX_DLL DWORD FX5_StoreInterfaceAdvTxConfig(FX5_TSERIAL Serial);
USB_DMX_DLL DWORD FX5_RegisterInputChangeBlockNotification(THOSTINPUTCHANGEPROCBLOCK Proc);
USB_DMX_DLL DWORD FX5_UnregisterInputChangeBlockNotification(void);

/// And the Functions from usbdmxsi.USB_DMX_DLL also

USB_DMX_DLL DWORD FX5_OpenInterface(FX5_TDMXArray * DMXOutArray, FX5_TDMXArray * DMXInArray, unsigned char Mode);
  // Modes:
  // 0: Do nothing - Standby
  // 1: DMX In -> DMX Out
  // 2: PC Out -> DMX Out
  // 3: DMX In + PC Out -> DMX Out
  // 4: DMX In -> PC In
  // 5: DMX In -> DMX Out & DMX In -> PC In
  // 6: PC Out -> DMX Out & DMX In -> PC In
  // 7: DMX In + PC Out -> DMX Out & DMX In -> PC In

USB_DMX_DLL DWORD FX5_CloseInterface(void);


#ifdef __cplusplus
}
#endif

