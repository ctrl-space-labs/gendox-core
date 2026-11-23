#import <WebKit/WebKit.h>
#import <objc/runtime.h>

static char safeAreaColorObserverKey;

@interface GendoxSafeAreaColorObserver : NSObject
@end

@implementation GendoxSafeAreaColorObserver
- (void)observeValueForKeyPath:(NSString *)keyPath
                     ofObject:(id)object
                       change:(NSDictionary<NSKeyValueChangeKey, id> *)change
                      context:(void *)context {
    if (context != &safeAreaColorObserverKey) {
        [super observeValueForKeyPath:keyPath ofObject:object change:change context:context];
        return;
    }
    WKWebView *webView = object;
    webView.superview.backgroundColor = webView.themeColor ?: webView.underPageBackgroundColor ?: UIColor.systemBackgroundColor;
}
@end

void configure_gendox_webview(void *handle) {
    WKWebView *webView = (__bridge WKWebView *)handle;
    UIView *host = webView.superview;
    UILayoutGuide *safeArea = host.safeAreaLayoutGuide;

    webView.scrollView.pinchGestureRecognizer.enabled = NO;
    webView.translatesAutoresizingMaskIntoConstraints = NO;
    [NSLayoutConstraint activateConstraints:@[
        [webView.topAnchor constraintEqualToAnchor:safeArea.topAnchor],
        [webView.bottomAnchor constraintEqualToAnchor:safeArea.bottomAnchor],
        [webView.leadingAnchor constraintEqualToAnchor:safeArea.leadingAnchor],
        [webView.trailingAnchor constraintEqualToAnchor:safeArea.trailingAnchor],
    ]];

    // Follow login, chat and theme changes with the page's own background color.
    GendoxSafeAreaColorObserver *observer = [GendoxSafeAreaColorObserver new];
    objc_setAssociatedObject(webView, &safeAreaColorObserverKey, observer, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
    [webView addObserver:observer forKeyPath:@"themeColor"
                 options:0 context:&safeAreaColorObserverKey];
    [webView addObserver:observer forKeyPath:@"underPageBackgroundColor"
                 options:NSKeyValueObservingOptionInitial context:&safeAreaColorObserverKey];
}
