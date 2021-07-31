import React, { FunctionComponent } from 'react';

import { FullHeightScrollContainer } from '../../components/styled';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import feedsSlice from '../../store/slices/feeds';
import sessionSlice, { Point } from '../../store/slices/session';
import Feed from './Feed/Feed';

interface Props {
    showFeedTitles: boolean;
    filterString: string;
}

const FeedList: FunctionComponent<Props> = (props: Props) => {
    const dispatch = useAppDispatch();
    const feeds = useAppSelector((state) => state.feeds);

    const handleFeedItemClick = (payload: { feedId: string; itemId: string }) =>
        dispatch(
            feedsSlice.actions.itemRead({
                feedId: payload.feedId,
                itemId: payload.itemId,
            }),
        );

    const handleFeedTitleClick = (feedId: string) => {
        dispatch(feedsSlice.actions.selectFeed(feedId));
    };

    const handleOnContextMenu = (payload: { anchorPoint: Point }) => {
        dispatch(sessionSlice.actions.showContextMenu(payload.anchorPoint));
    };

    return (
        <FullHeightScrollContainer>
            {feeds.feeds.map((feed) => (
                <Feed
                    key={feed.id}
                    isSelected={feeds.selectedFeedId === feed.id}
                    feed={feed}
                    onFeedTitleClick={() => handleFeedTitleClick(feed.id)}
                    onItemClick={handleFeedItemClick}
                    onContextMenu={handleOnContextMenu}
                    showTitle={props.showFeedTitles}
                    filterString={props.filterString}
                />
            ))}
        </FullHeightScrollContainer>
    );
};

export default FeedList;
