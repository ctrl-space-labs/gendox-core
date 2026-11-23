#import <UIKit/UIKit.h>
#import <objc/runtime.h>

static BOOL openServerShortcut(UIApplicationShortcutItem *shortcut) {
    if (![shortcut.type isEqualToString:@"dev.gendox.app.server"]) return NO;
    // Hand this off to the same Tauri Opened event as the Android launcher shortcut.
    UIApplication *application = UIApplication.sharedApplication;
    return [application.delegate application:application openURL:[NSURL URLWithString:@"gendox://server"] options:@{}];
}

// The app is running: UIKit hands the quick action to the scene delegate.
static void performShortcut(id delegate, SEL selector, UIWindowScene *scene,
                            UIApplicationShortcutItem *shortcut, void (^completionHandler)(BOOL)) {
    completionHandler(openServerShortcut(shortcut));
}

static void (*connectScene)(id, SEL, UIScene *, UISceneSession *, UISceneConnectionOptions *);

// A launch from the quick action: UIKit passes it with the scene's connection options.
static void connectSceneWithShortcut(id delegate, SEL selector, UIScene *scene, UISceneSession *session,
                                     UISceneConnectionOptions *options) {
    connectScene(delegate, selector, scene, session, options);
    openServerShortcut(options.shortcutItem);
}

void register_gendox_server_shortcut(void) {
    // Tauri owns the scene delegate and has no quick action registration API.
    Class sceneDelegate = objc_getClass("TaoSceneDelegate");
    if (!sceneDelegate) return;
    class_addMethod(sceneDelegate, @selector(windowScene:performActionForShortcutItem:completionHandler:),
                    (IMP)performShortcut, "v@:@@@?");
    Method connect = class_getInstanceMethod(sceneDelegate, @selector(scene:willConnectToSession:options:));
    if (connect) {
        connectScene = (typeof(connectScene))method_setImplementation(connect, (IMP)connectSceneWithShortcut);
    }
}
