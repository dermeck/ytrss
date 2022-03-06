import styled from '@emotion/styled';

import React, { Fragment, FunctionComponent, memo, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Folder } from 'react-feather';

import { colors, rgba } from '../../base-components/styled/colors';
import { useAppDispatch } from '../../store/hooks';
import feedsSlice, { Feed as FeedType, FeedItem as FeedItemType } from '../../store/slices/feeds';
import sessionSlice, { Point } from '../../store/slices/session';
import FeedItem from './FeedItem';

const FeedContainer = styled.ul`
    padding-left: ${(props: { indented: boolean }) => (props.indented ? '2.25rem' : '1.5rem')};
    margin: 0 0 0.2rem 0;
`;

interface FeedTitleContainerProps {
    highlight: boolean;
    focus: boolean;
}

const FeedTitleContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0.05rem 0 0.2rem 0.5rem;

    background-color: ${(props: FeedTitleContainerProps) =>
        props.highlight
            ? props.focus
                ? rgba(colors.highlightBackgroundColor1, 0.9)
                : colors.highlightBackgroundColorNoFocus
            : 'inherit'};
    color: ${(props: FeedTitleContainerProps) =>
        props.highlight && props.focus ? colors.highlightColor1Light : 'inherit'};
`;

const FeedTitle = styled.label`
    padding-top: 4px;
    margin-left: 0.25rem;
`;

const ToggleIndicator = styled.div`
    margin-right: 0.25rem;
    margin-bottom: -8px;
`;

interface Props {
    feed: FeedType;
    isSelected: boolean;
    showTitle: boolean;
    filterString: string;
}

const renderItem = (item: FeedItemType, props: Props) => (
    <FeedItem key={item.id + item.title} feedId={props.feed.id} item={item} />
);

const Feed: FunctionComponent<Props> = (props: Props) => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (props.isSelected) {
            setFocus(true);
        }
    }, [props.isSelected]);

    const handleFeedTitleClick = () => {
        dispatch(feedsSlice.actions.selectFeed(props.feed.id));
    };

    const handleOnContextMenu = (anchorPoint: Point) => {
        setFocus(true);
        dispatch(sessionSlice.actions.showContextMenu(anchorPoint));
        dispatch(feedsSlice.actions.selectFeed(props.feed.id));
    };

    const [expanded, setExpanded] = useState<boolean>(true);

    const [focus, setFocus] = useState<boolean>(false);

    return (
        <Fragment>
            {props.showTitle && (
                <FeedTitleContainer
                    tabIndex={0}
                    highlight={props.isSelected}
                    focus={focus}
                    onClick={() => {
                        setExpanded(!expanded);
                        setFocus(true);
                        handleFeedTitleClick();
                    }}
                    onBlur={() => {
                        setFocus(false);
                        dispatch(sessionSlice.actions.hideMenu()); // TODO only if visible
                    }}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        handleOnContextMenu({ x: e.clientX, y: e.clientY });
                    }}>
                    <ToggleIndicator>
                        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </ToggleIndicator>
                    <Folder size={16} />
                    <FeedTitle>{props.feed.title || props.feed.url}</FeedTitle>
                </FeedTitleContainer>
            )}

            {(expanded || !props.showTitle) && props.feed.items.length !== 0 && (
                <FeedContainer indented={props.showTitle}>
                    {props.feed.items.map(
                        (item) =>
                            !item.isRead &&
                            item.title?.toLowerCase().includes(props.filterString.toLowerCase()) &&
                            renderItem(item, props),
                    )}
                </FeedContainer>
            )}
        </Fragment>
    );
};

const MemoizedFeed = memo(Feed);

if (process.env.MODE === 'dev') {
    Feed.whyDidYouRender = true;
}

export default MemoizedFeed;
