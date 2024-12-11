import { Dispatch, Middleware } from '@reduxjs/toolkit';

import feedsSlice, { selectTotalUnreadItems, fetchAllFeedsCommand, fetchFeedsCommand } from '../slices/feeds';
import { RootState } from '../store';

const updateBadge = (feedSliceState: RootState['feeds']) => {
    const totalUnreadReadItems = selectTotalUnreadItems(feedSliceState);

    if (process.env.STAND_ALONE) {
        return;
    }

    // TODO mr make this configurable in options
    browser.sidebarAction.setIcon({
        path: {
            16: totalUnreadReadItems > 0 ? 'icon_unread.svg' : 'rss.svg',
            32: totalUnreadReadItems > 0 ? 'icon_unread.svg' : 'rss.svg',
        },
    });

    browser.action.setBadgeText({ text: totalUnreadReadItems !== 0 ? totalUnreadReadItems.toString() : '' });
};

export const feedMiddleware: Middleware<object, RootState, Dispatch> = (middlewareApi) => (next) => async (action) => {
    if (fetchAllFeedsCommand.match(action)) {
        const feedsTofetch = middlewareApi.getState().feeds.feeds.map((x) => x.id);

        if (feedsTofetch.length > 0) {
            middlewareApi.dispatch(fetchFeedsCommand(feedsTofetch));
        }
    }

    await next(action);

    // reducers must run before this code
    if (
        feedsSlice.actions.updateFeeds.match(action) ||
        feedsSlice.actions.markItemAsRead.match(action) ||
        feedsSlice.actions.markSelectedNodeAsRead.match(action) ||
        feedsSlice.actions.markAllAsRead.match(action) ||
        feedsSlice.actions.deleteSelectedNode.match(action)
    ) {
        updateBadge(middlewareApi.getState().feeds);
    }
};
