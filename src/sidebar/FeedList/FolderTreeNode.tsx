import React, { Fragment, memo, useEffect, useState } from 'react';

import { menuWidthInPx } from '../../base-components/styled/Menu';
import { NodeType } from '../../model/feeds';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import feedsSlice, { selectTreeNode } from '../../store/slices/feeds';
import sessionSlice from '../../store/slices/session';
import useWindowDimensions from '../../utils/hooks/useWindowDimensions';
import Folder from './Folder';
import FolderSubTreeNode from './FolderSubTreeNode';

interface Props {
    nodeId: string;
    selectedId?: string;
    showTitle: boolean;
    filterString: string;
    validDropTarget: boolean;
}

// TODO find a more robust way to determine menu height
const contextMenuHeight = 64; // 2 menu items, each 32px

const FolderTreeNode = (props: Props) => {
    const node = useAppSelector((state) => selectTreeNode(state.feeds, props.nodeId));
    const draggedId = useAppSelector((state) => state.session.draggedId);

    const dispatch = useAppDispatch();

    useEffect(() => {
        if (node && props.selectedId === node.data.id && !focus) {
            setFocus(true);
        }
    }, [props.selectedId]);

    const [expanded, setExpanded] = useState<boolean>(true);
    const [focus, setFocus] = useState<boolean>(false);

    const { height, width } = useWindowDimensions();

    if (!node) {
        return <Fragment />;
    }

    const { id, title } = node.data;

    const handleOnClickTitle = () => {
        if (id !== undefined) {
            dispatch(feedsSlice.actions.select(id));
        }
    };

    const handleOnClickFolder = () => {
        setExpanded(!expanded);
        if (!focus) {
            setFocus(true);
        }
        handleOnClickTitle();
    };

    const handleOnBlurFolder = () => {
        if (focus) {
            setFocus(false);
        }
    };

    const handleOnContextMenuFolder = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        e.preventDefault();

        if (width === undefined || height === undefined) {
            console.error('Could not open context menu. Unable to determine dimensions of window.');
            return;
        }

        const x = width - e.clientX < menuWidthInPx ? width - menuWidthInPx : e.clientX;
        const y = height - e.clientY < contextMenuHeight ? height - contextMenuHeight : e.clientY;

        dispatch(sessionSlice.actions.showContextMenu({ x, y }));

        if (id !== undefined) {
            dispatch(feedsSlice.actions.select(id));
        }
    };

    const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
        event.dataTransfer.setData('moep', id); // TODO do we need this?

        if (draggedId !== id) {
            dispatch(sessionSlice.actions.changeDragged(id));
        }
    };
    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const data = event.dataTransfer.getData('moep'); // TODO do we need this?
        console.log('dropped id on id', data, id);

        return dispatch(sessionSlice.actions.dropped(id)); // id is the target
    };
    const handleDragEnd = () => {
        dispatch(sessionSlice.actions.changeDragged(undefined));
    };

    // disable drop on self and all children and all feeds(for now) // TODO enable feed as drop target (insert before/after)
    const validDropTarget =
        id !== draggedId && props.validDropTarget && (node.nodeType !== NodeType.Feed || draggedId === undefined);

    return (
        <Folder
            title={title ?? (node.nodeType === NodeType.Feed ? node.data.url : '')}
            showTitle={props.showTitle}
            selected={props.selectedId === id}
            focus={focus}
            expanded={expanded}
            handleOnClick={handleOnClickFolder}
            handleOnBlur={handleOnBlurFolder}
            handleOnContextMenu={handleOnContextMenuFolder}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            validDropTarget={validDropTarget}>
            <FolderSubTreeNode
                node={node}
                {...props}
                validDropTarget={validDropTarget}
                feedItemsVisable={draggedId === undefined}
            />
        </Folder>
    );
};

const MemoizedFolderTreeNode = memo(FolderTreeNode);

if (process.env.MODE === 'dev') {
    FolderTreeNode.whyDidYouRender = true;
}

export default MemoizedFolderTreeNode;
